<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useData } from 'vitepress'

// `label` replaces `name` as the result's heading; empty shows the pin's number alone.
type Result = { name: string; meta: string; html: string; label?: string }
// A file starts folded away when `open` is false.
type File = { name: string; html: string; open?: boolean }
type Legend = { label: string; cls: string }[]
// A variant of a case card drawing its own code: shown as a tab.
type View = { label: string; code: string; files: File[]; results: Result[]; legend: Legend; notes?: string[] }
type Payload = View & {
  feature: string
  codeName?: string
  markers: string[]
  layout: 'split' | 'stack' | 'single' | 'tooltip' | 'inline'
  variants?: View[]
  source: string
  url?: string
}

const props = defineProps<{ data?: string; missing?: string }>()

const { lang } = useData()
const zh = computed(() => lang.value.startsWith('zh'))

const payload = computed<Payload | null>(() => {
  if (!props.data) return null
  const json = typeof atob === 'function' ? atob(props.data) : Buffer.from(props.data, 'base64').toString('utf8')
  const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as Payload
})

const open = ref(false)
const tab = ref(0)
const view = computed<View | null>(() => payload.value?.variants?.[tab.value] ?? payload.value)

// Files shown open, as the card says or as the reader toggled them; a
// folded-away file waits as a chip in one row.
const toggled = ref(new Map<string, boolean>())
const isOpen = (file: File): boolean => toggled.value.get(file.name) ?? file.open !== false
const openFiles = computed(() => (view.value?.files ?? []).filter(isOpen))
const shutFiles = computed(() => (view.value?.files ?? []).filter((file) => !isOpen(file)))
function toggleFile(file: File): void {
  toggled.value = new Map(toggled.value).set(file.name, !isOpen(file))
}
// Pins answer on hover and tap: in a tip over the code, or inline below it.
const pins = computed(() => payload.value?.layout === 'tooltip' || payload.value?.layout === 'inline')
const inline = computed(() => payload.value?.layout === 'inline')
const codeEl = ref<HTMLElement | null>(null)

const indexOf = (name: string): number => payload.value?.markers.indexOf(name) ?? -1
const results = computed(() =>
  [...(view.value?.results ?? [])].sort((a, b) => {
    const ia = indexOf(a.name)
    const ib = indexOf(b.name)
    return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib)
  })
)
const byName = computed(() => new Map(results.value.map((r) => [r.name, r])))
const sourceUrl = computed(() =>
  payload.value ? (payload.value.url ?? `https://github.com/clice-io/clice/blob/main/${payload.value.source}`) : ''
)

// Tooltip mode: the result of a marker pops up over its pin.
const tip = ref<{ result: Result; left: number; top: number; arrow: number } | null>(null)
const tipEl = ref<HTMLElement | null>(null)
const pinned = ref(false)

// A pin's places in the code show while its result is up.
watch(tip, (value) => {
  const host = codeEl.value
  if (!host) return
  for (const el of host.querySelectorAll('.mark-range[data-for].on, .pin.on')) el.classList.remove('on')
  if (!value) return
  const name = CSS.escape(value.result.name)
  for (const el of host.querySelectorAll(`.mark-range[data-for~="${name}"], .pin[data-name="${name}"]`)) el.classList.add('on')
})

// An entry of a result naming a place (`data-mark`) lights it in the code
// while hovered, dimming the pin's other places; a whole-line mark lights
// its line.
function lightMark(event: MouseEvent, on: boolean): void {
  const item = (event.target as HTMLElement).closest('[data-mark]') as HTMLElement | null
  const host = codeEl.value
  if (!item || !host) return
  if (!on && item.contains(event.relatedTarget as Node | null)) return
  host.classList.toggle('focusing', on)
  for (const el of host.querySelectorAll(`[data-for~="${CSS.escape(item.dataset.mark ?? '')}"]`)) {
    el.classList.toggle('lit', on)
    if (el.classList.contains('line-mark')) el.closest('.line')?.classList.toggle('hl', on)
  }
}

// The tip hangs below its pin and slides sideways as far as needed to stay
// inside the code pane; the arrow keeps pointing at the pin.
async function showFor(pin: HTMLElement, sticky: boolean): Promise<void> {
  const name = pin.dataset.name ?? ''
  const result = byName.value.get(name)
  const host = codeEl.value
  if (!result || !host) return
  const hostRect = host.getBoundingClientRect()
  const rect = pin.getBoundingClientRect()
  const anchor = rect.left - hostRect.left + rect.width / 2
  const top = rect.bottom - hostRect.top + 6
  tip.value = { result, left: 0, top, arrow: 12 }
  pinned.value = sticky
  await nextTick()
  const width = tipEl.value?.offsetWidth ?? 0
  const margin = 8
  const left = Math.max(margin, Math.min(anchor - 24, hostRect.width - width - margin))
  const arrow = Math.max(10, Math.min(anchor - left - 7, width - 24))
  tip.value = { result, left, top, arrow }
}

function onOver(event: MouseEvent): void {
  if (pinned.value && !inline.value) return
  const pin = (event.target as HTMLElement).closest('.pin') as HTMLElement | null
  if (pin) void showFor(pin, false)
}

function onOut(event: MouseEvent): void {
  // Inline, the last pin's result stays until another pin's replaces it.
  if (pinned.value || inline.value) return
  const to = event.relatedTarget as HTMLElement | null
  if (to && (to.closest('.snap-tip') || to.closest('.pin'))) return
  tip.value = null
}

// Lines of the main file, for outline highlights.
function mainLines(): HTMLElement[] {
  const host = codeEl.value
  if (!host) return []
  const source = host.querySelector('.snap-source')
  return source ? Array.from(source.querySelectorAll<HTMLElement>('.line')) : []
}

// Lines of the file a fold mark is in.
function foldLines(mark: HTMLElement): HTMLElement[] {
  const source = mark.closest('.snap-source')
  return source ? Array.from(source.querySelectorAll<HTMLElement>('.line')) : []
}

function foldRegion(mark: HTMLElement, cls: string, on: boolean): void {
  const lines = foldLines(mark)
  for (let l = Number(mark.dataset.start); l <= Number(mark.dataset.end); l += 1) lines[l]?.classList.toggle(cls, on)
}

function onFoldOver(event: MouseEvent): void {
  const mark = (event.target as HTMLElement).closest('.fold-mark') as HTMLElement | null
  if (mark) foldRegion(mark, 'fold-hl', true)
}

function onFoldOut(event: MouseEvent): void {
  const mark = (event.target as HTMLElement).closest('.fold-mark') as HTMLElement | null
  if (mark) foldRegion(mark, 'fold-hl', false)
}

function onFoldClick(event: MouseEvent): void {
  const mark = (event.target as HTMLElement).closest('.fold-mark') as HTMLElement | null
  if (!mark) return
  const start = Number(mark.dataset.start)
  const end = Number(mark.dataset.end)
  const collapsed = mark.classList.toggle('collapsed')
  mark.textContent = collapsed ? '▸' : '▾'
  // A case card's fold ends its first line with its own collapsed text.
  const fold = mark.dataset.fold
  if (fold) {
    for (const el of mark.closest('.line')?.querySelectorAll(`[data-fold="${CSS.escape(fold)}"]`) ?? []) {
      el.classList.toggle('shut', collapsed)
    }
  } else {
    mark.closest('.line')?.classList.toggle('collapsed-line', collapsed)
  }
  foldRegion(mark, 'fold-hl', false)
  const lines = foldLines(mark)
  for (let l = start + 1; l <= end; l += 1) {
    const line = lines[l]
    if (!line) continue
    if (collapsed) {
      line.dataset.foldedBy = String(Number(line.dataset.foldedBy ?? 0) + 1)
      line.classList.add('folded')
    } else {
      const n = Number(line.dataset.foldedBy ?? 1) - 1
      line.dataset.foldedBy = String(n)
      if (n <= 0) line.classList.remove('folded')
    }
  }
  event.stopPropagation()
}

function highlightLines(spec: string | undefined, sel: string | undefined, on: boolean): void {
  const lines = mainLines()
  if (!spec) return
  const [a, b] = spec.split('-').map(Number)
  for (let l = a ?? 0; l <= (b ?? a ?? 0); l += 1) lines[l]?.classList.toggle('hl', on)
  if (sel !== undefined) lines[Number(sel)]?.classList.toggle('hl-sel', on)
}

function onResultOver(event: MouseEvent): void {
  const item = (event.target as HTMLElement).closest('[data-lines]') as HTMLElement | null
  if (item) highlightLines(item.dataset.lines, item.dataset.sel, true)
  lightMark(event, true)
}

function onResultOut(event: MouseEvent): void {
  const item = (event.target as HTMLElement).closest('[data-lines]') as HTMLElement | null
  if (item) highlightLines(item.dataset.lines, item.dataset.sel, false)
  lightMark(event, false)
}

function onCodeOver(event: MouseEvent): void {
  if (pins.value) onOver(event)
  else onFoldOver(event)
  lightMark(event, true)
}

function onCodeOut(event: MouseEvent): void {
  if (pins.value) onOut(event)
  else onFoldOut(event)
  lightMark(event, false)
}

function onCodeClick(event: MouseEvent): void {
  if (pins.value && !(event.target as HTMLElement).closest('.fold-mark')) onClick(event)
  else onFoldClick(event)
}

function onClick(event: MouseEvent): void {
  const pin = (event.target as HTMLElement).closest('.pin') as HTMLElement | null
  if (pin) {
    if (pinned.value && tip.value?.result.name === pin.dataset.name && !inline.value) {
      tip.value = null
      pinned.value = false
    } else {
      void showFor(pin, !inline.value)
    }
    event.stopPropagation()
    return
  }
  if (!(event.target as HTMLElement).closest('.snap-tip') && !inline.value) {
    tip.value = null
    pinned.value = false
  }
}

function onDocClick(): void {
  if (pinned.value && !inline.value) {
    tip.value = null
    pinned.value = false
  }
}

// The tip's position is measured once, so any layout change dismisses it.
function onLayoutChange(): void {
  if (inline.value) return
  tip.value = null
  pinned.value = false
}

// Inline, the first pin with a result answers until another is hovered.
async function showFirst(): Promise<void> {
  tip.value = null
  pinned.value = false
  if (!inline.value) return
  await nextTick()
  const name = payload.value?.markers.find((m) => byName.value.has(m))
  const pin = name ? codeEl.value?.querySelector<HTMLElement>(`.pin[data-name="${CSS.escape(name)}"]`) : null
  if (pin) void showFor(pin, false)
}

function scrollers(): Element[] {
  return Array.from(codeEl.value?.querySelectorAll('pre') ?? [])
}

function unlisten(): void {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('resize', onLayoutChange)
  for (const pre of scrollers()) pre.removeEventListener('scroll', onLayoutChange)
}

function listen(): void {
  document.addEventListener('click', onDocClick)
  window.addEventListener('resize', onLayoutChange)
  for (const pre of scrollers()) pre.addEventListener('scroll', onLayoutChange, { passive: true })
}

watch(open, async (value) => {
  tip.value = null
  pinned.value = false
  if (value) {
    await nextTick()
    listen()
    await showFirst()
  } else {
    unlisten()
  }
})

watch(tab, async () => {
  unlisten()
  await nextTick()
  listen()
  await showFirst()
})

onBeforeUnmount(unlisten)
</script>

<template>
  <div v-if="!payload" class="snap snap-missing">
    {{ zh ? '示例尚未同步' : 'Example not synced yet' }} <code>{{ missing }}</code>
  </div>
  <div v-else class="snap" :class="{ open, case: !!payload.url }">
    <button class="snap-toggle" type="button" @click="open = !open">
      <span class="chev" aria-hidden="true">▶</span>
      {{ open ? (zh ? '收起示例' : 'Hide example') : (zh ? '查看示例' : 'Show example') }}
    </button>
    <div v-if="open && view" class="snap-body" :class="payload.layout">
      <div
        ref="codeEl"
        class="snap-code"
        @mouseover="onCodeOver"
        @mouseout="onCodeOut"
        @click="onCodeClick"
      >
        <div v-if="payload.variants" class="snap-tabs" role="tablist">
          <button
            v-for="(variant, i) in payload.variants"
            :key="i"
            type="button"
            role="tab"
            :aria-selected="tab === i"
            :class="{ on: tab === i }"
            @click.stop="tab = i"
            v-html="variant.label"
          />
        </div>
        <span v-if="payload.codeName && view.code" class="snap-file-name snap-entry-name">{{ payload.codeName }}</span>
        <div v-if="view.code" class="snap-source" v-html="view.code" />
        <div v-for="file in openFiles" :key="file.name" class="snap-file">
          <button
            v-if="payload.url"
            type="button"
            class="snap-file-name open"
            :aria-expanded="true"
            @click.stop="toggleFile(file)"
          >{{ file.name }}</button>
          <span v-else class="snap-file-name">{{ file.name }}</span>
          <div class="snap-source" v-html="file.html" />
        </div>
        <div v-if="shutFiles.length" class="snap-file snap-file-row">
          <button
            v-for="file in shutFiles"
            :key="file.name"
            type="button"
            class="snap-file-name"
            :aria-expanded="false"
            @click.stop="toggleFile(file)"
          >{{ file.name }}</button>
        </div>
        <div v-if="payload.layout === 'inline'" class="snap-active">
          <template v-if="tip">
            <i>{{ indexOf(tip.result.name) + 1 }}</i>
            <div class="snap-active-body" v-html="tip.result.html" />
          </template>
        </div>
        <div v-if="view.notes?.length" class="snap-notes" v-html="view.notes.join('')" />
        <div v-if="view.legend.length" class="snap-legend">
          <span v-for="item in view.legend" :key="item.label" :class="item.cls">{{ item.label }}</span>
        </div>
        <div class="snap-foot">
          <span v-if="pins" class="snap-hint">{{ zh ? '悬停或点击编号查看结果' : 'Hover or tap a number for the result' }}</span>
          <a class="snap-link" :href="sourceUrl" target="_blank" rel="noopener noreferrer">{{ payload.source }}</a>
        </div>
        <div
          v-if="tip && payload.layout === 'tooltip'"
          ref="tipEl"
          class="snap-tip"
          :class="{ pinned }"
          :style="{ left: tip.left + 'px', top: tip.top + 'px', '--arrow': tip.arrow + 'px' }"
        >
          <div class="snap-result-head">
            <i v-if="indexOf(tip.result.name) >= 0">{{ indexOf(tip.result.name) + 1 }}</i>
            <span v-if="(tip.result.label ?? tip.result.name) !== ''" class="snap-result-name">{{ tip.result.label ?? tip.result.name }}</span>
            <span v-if="tip.result.meta" class="snap-meta">{{ tip.result.meta }}</span>
          </div>
          <div class="snap-card" v-html="tip.result.html" />
        </div>
      </div>
      <div v-if="payload.layout === 'split' || payload.layout === 'stack'" class="snap-results" @mouseover="onResultOver" @mouseout="onResultOut">
        <template v-if="results.length > 0">
          <div v-for="r in results" :key="r.name" class="snap-result">
            <div v-if="indexOf(r.name) >= 0 || (r.label ?? r.name) !== '' || r.meta" class="snap-result-head">
              <i v-if="indexOf(r.name) >= 0">{{ indexOf(r.name) + 1 }}</i>
              <span v-if="(r.label ?? r.name) !== ''" class="snap-result-name">{{ r.label ?? r.name }}</span>
              <span v-if="r.meta" class="snap-meta">{{ r.meta }}</span>
            </div>
            <div class="snap-card" v-html="r.html" />
          </div>
        </template>
        <p v-else class="snap-empty">{{ zh ? '尚未记录快照' : 'No snapshot recorded yet' }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snap {
  margin-top: 12px;
}

.snap-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 999px;
  background: var(--paper);
  font-family: var(--clice-font-display);
  font-weight: 700;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}

.snap-toggle:hover {
  border-color: var(--bow);
  color: var(--bow);
}

.chev {
  font-size: 9px;
  color: var(--bow);
  transition: transform 0.15s ease;
}

.snap.open .chev {
  transform: rotate(90deg);
}

.snap-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-top: 12px;
  border: var(--line) solid var(--line-color);
  border-radius: var(--radius);
  box-shadow: var(--hard-shadow);
}

.snap-code {
  border-radius: var(--radius) var(--radius) 0 0;
}

.single .snap-code,
.tooltip .snap-code {
  border-radius: var(--radius);
}

@media (min-width: 900px) {
  .split .snap-code {
    border-radius: var(--radius) 0 0 var(--radius);
  }
}

.snap-results {
  border-radius: 0 0 var(--radius) var(--radius);
}

@media (min-width: 900px) {
  .split .snap-results {
    border-radius: 0 var(--radius) var(--radius) 0;
  }
}

@media (min-width: 900px) {
  .snap-body.split {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  }
}

.snap-code {
  position: relative;
  min-width: 0;
  background: var(--paper-2);
  border-bottom: var(--line) solid var(--line-color);
}

.single .snap-code,
.tooltip .snap-code {
  border-bottom: none;
}

.snap-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
  padding: 6px 16px 10px;
  min-width: 0;
}

.snap-foot > * {
  min-width: 0;
  overflow-wrap: anywhere;
}

.snap-hint {
  font-size: 11px;
  color: var(--ink-3);
}

.snap-active {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 42px;
  padding: 10px 16px 6px;
  border-top: var(--line-thin) dashed var(--line-color);
  font-size: 13px;
}

.snap-active i {
  display: inline-block;
  min-width: 15px;
  height: 15px;
  margin-top: 2px;
  padding: 0 3px;
  border-radius: 999px;
  border: 1px solid var(--line-color);
  background: var(--bow);
  color: #ffffff;
  font-family: var(--clice-font-display);
  font-style: normal;
  font-weight: 900;
  font-size: 10px;
  line-height: 13px;
  text-align: center;
}

.snap-active-body {
  flex: 1 1 auto;
  min-width: 0;
}

.snap-active-body :deep(p) {
  margin: 0 0 4px;
}

.inline .snap-code {
  border-radius: var(--radius);
  border-bottom: none;
}

.inline .snap-source :deep(.pin),
.tooltip .snap-source :deep(.pin) {
  cursor: pointer;
}

.snap-source :deep(.pin.on i),
.inline .snap-source :deep(.pin:hover i),
.tooltip .snap-source :deep(.pin:hover i) {
  background: var(--bow);
  color: #ffffff;
}

.snap-tip {
  position: absolute;
  z-index: 20;
  width: max-content;
  max-width: min(460px, calc(100% - 16px));
  padding: 8px 10px 10px;
  border: var(--line) solid var(--line-color);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: var(--hard-shadow);
  text-align: left;
}

.dark .snap-tip {
  background: var(--paper-2);
}

.snap-tip::before {
  content: "";
  position: absolute;
  top: -8px;
  left: var(--arrow);
  border-style: solid;
  border-width: 0 7px 8px 7px;
  border-color: transparent transparent var(--line-color) transparent;
}

.snap-tip .snap-card {
  padding: 8px 10px;
}

.snap-card :deep([class*='language-'] code) {
  padding: 0;
}

.snap-source :deep(.block-lines .line) {
  display: block;
}

.snap-source :deep(.line.hl) {
  background: var(--straw-soft);
}

.snap-source :deep(.line.hl-sel) {
  background: var(--straw);
}

.snap-results :deep([data-lines]) {
  cursor: default;
  border-radius: 4px;
}

.snap-results :deep([data-lines]:hover) {
  background: var(--straw-soft);
}

.snap-results :deep(.link-file) {
  margin: 6px 0 2px;
  padding: 0 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--ink-3);
  list-style: none;
}

@media (min-width: 900px) {
  .split .snap-code {
    border-bottom: none;
    border-right: var(--line) solid var(--line-color);
  }
}

.single .snap-code {
  border-bottom: none;
}

.snap-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 16px 0;
  border-top: var(--line-thin) dashed var(--line-color);
}

.snap-legend > span {
  padding: 0 8px;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 20px;
}

.snap-source :deep(pre) {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  background: transparent !important;
  font-size: 13px;
  line-height: 1.6;
}

.snap-source :deep(code) {
  font-family: var(--vp-font-family-mono);
}

.snap-file {
  border-top: var(--line-thin) dashed var(--line-color);
}

button.snap-file-name {
  color: var(--ink);
  line-height: 18px;
  cursor: pointer;
}

button.snap-file-name::before {
  content: "▸";
  display: inline-block;
  margin-right: 6px;
  color: var(--bow);
  font-size: 9px;
  transition: transform 0.15s ease;
}

button.snap-file-name.open::before {
  transform: rotate(90deg);
}

button.snap-file-name:hover {
  border-color: var(--bow);
}

.snap-file-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 16px 10px;
}

.snap-file-row .snap-file-name {
  margin: 0;
}

.case .snap-file > .snap-file-name + .snap-source :deep(pre) {
  padding-top: 8px;
}

.snap-file-name {
  display: inline-block;
  margin: 8px 0 0 16px;
  padding: 0 8px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 4px;
  background: var(--straw-soft);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
}

.snap-entry-name {
  margin-top: 10px;
}

.snap-entry-name + .snap-source :deep(pre) {
  padding-top: 8px;
}

.snap-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 16px 0;
}

.snap-tabs button {
  padding: 1px 10px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 999px;
  background: var(--paper);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--ink-2);
  cursor: pointer;
}

.snap-tabs button:hover {
  color: var(--bow);
  border-color: var(--bow);
}

.snap-tabs button.on {
  background: var(--bow);
  border-color: var(--bow);
  color: #ffffff;
}

.dark .snap-tabs button.on {
  color: var(--paper-3);
}

.snap-notes {
  padding: 8px 16px 0;
  border-top: var(--line-thin) dashed var(--line-color);
}

.snap-notes :deep(.case-wrong) {
  margin: 0 0 4px;
}

.snap-source :deep(.pin) {
  display: inline-block;
  vertical-align: 1px;
  margin: 0 2px 0 0;
}

.snap-source :deep(.pin i) {
  display: inline-block;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 999px;
  border: 1px solid var(--line-color);
  background: var(--straw);
  color: #2b3040;
  font-family: var(--clice-font-display);
  font-style: normal;
  font-weight: 900;
  font-size: 10px;
  line-height: 13px;
  text-align: center;
}

.snap-source :deep(.pin-range) {
  background: var(--straw-soft);
  border-bottom: 2px solid var(--straw-dark);
  border-radius: 2px;
}

.snap-results {
  background: var(--panel);
  min-width: 0;
}

.dark .snap-results {
  background: var(--paper);
}

.snap-missing {
  padding: 8px 12px;
  border: var(--line-thin) dashed var(--line-color);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--ink-3);
}

.snap-link {
  display: block;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--ink-3) !important;
  text-decoration: none !important;
}

.snap-link:hover {
  color: var(--bow) !important;
}

.case .snap-link {
  line-break: anywhere;
}

.snap-code > .snap-file:first-child {
  border-top: none;
}

.snap-result + .snap-result {
  border-top: var(--line-thin) dashed var(--line-color);
}

.snap-result-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.snap-result-head i {
  display: inline-block;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 999px;
  border: 1px solid var(--line-color);
  background: var(--straw);
  color: #2b3040;
  font-family: var(--clice-font-display);
  font-style: normal;
  font-weight: 900;
  font-size: 10px;
  line-height: 13px;
  text-align: center;
}

.snap-result-name {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
}

.snap-result {
  padding: 12px 16px 16px;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: hidden;
  min-width: 0;
}

.snap-meta {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--ink-3);
}

/* the recorded result, drawn like an editor tooltip */
.snap-card {
  padding: 10px 12px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 4px;
  background: var(--paper);
  font-size: 13.5px;
  line-height: 1.55;
}

.dark .snap-card {
  background: var(--paper-2);
}

.snap-card :deep(h1),
.snap-card :deep(h2),
.snap-card :deep(h3),
.snap-card :deep(h4) {
  display: block;
  margin: 0 0 4px;
  padding: 0;
  font-family: var(--vp-font-family-base);
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0;
  border: none;
  background: none;
}

.snap-card :deep(h2::before),
.snap-card :deep(h2::after),
.snap-card :deep(h3::before) {
  display: none;
}

.snap-card :deep(p) {
  margin: 4px 0;
}

.snap-card :deep(hr) {
  margin: 8px 0;
  border: none;
  border-top: var(--line-thin) dashed var(--line-color);
}

.snap-card :deep(div[class*='language-']) {
  margin: 6px 0 0;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
}

.snap-card :deep(div[class*='language-'] > span.lang),
.snap-card :deep(div[class*='language-'] > button.copy) {
  display: none;
}

.snap-card :deep(pre) {
  margin: 0;
  padding: 6px 0 0;
  background: transparent !important;
  font-size: 12.5px;
  overflow-x: auto;
}

.snap-card :deep(:not(pre) > code) {
  padding: 0 4px;
  border: none;
  background: var(--paper-3);
  font-size: 12.5px;
}

.snap-card :deep(code) {
  font-family: var(--vp-font-family-mono);
}

.snap-card :deep(.snap-raw) {
  white-space: pre-wrap;
}

.snap-empty {
  margin: 0;
  padding: 16px;
  color: var(--ink-3);
}
</style>
