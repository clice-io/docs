<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

type Result = { name: string; meta: string; html: string }
type File = { name: string; html: string }
type Payload = {
  feature: string
  code: string
  markers: string[]
  files: File[]
  results: Result[]
  layout: 'split' | 'single'
  legend: { label: string; cls: string }[]
  source: string
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

const indexOf = (name: string): number => payload.value?.markers.indexOf(name) ?? -1
const results = computed(() =>
  [...(payload.value?.results ?? [])].sort((a, b) => {
    const ia = indexOf(a.name)
    const ib = indexOf(b.name)
    return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib)
  })
)
const sourceUrl = computed(() =>
  payload.value ? `https://github.com/clice-io/clice/blob/main/${payload.value.source}` : ''
)
</script>

<template>
  <div v-if="!payload" class="snap snap-missing">
    {{ zh ? '示例尚未同步' : 'Example not synced yet' }} <code>{{ missing }}</code>
  </div>
  <div v-else class="snap" :class="{ open }">
    <button class="snap-toggle" type="button" @click="open = !open">
      <span class="chev" aria-hidden="true">▶</span>
      {{ open ? (zh ? '收起示例' : 'Hide example') : (zh ? '查看示例' : 'Show example') }}
    </button>
    <div v-if="open" class="snap-body" :class="payload.layout">
      <div class="snap-code">
        <div class="snap-source" v-html="payload.code" />
        <div v-for="file in payload.files" :key="file.name" class="snap-file">
          <span class="snap-file-name">{{ file.name }}</span>
          <div class="snap-source" v-html="file.html" />
        </div>
        <div v-if="payload.legend.length" class="snap-legend">
          <span v-for="item in payload.legend" :key="item.label" :class="item.cls">{{ item.label }}</span>
        </div>
        <a class="snap-link" :href="sourceUrl" target="_blank" rel="noopener noreferrer">{{ payload.source }}</a>
      </div>
      <div v-if="payload.layout === 'split'" class="snap-results">
        <template v-if="results.length > 0">
          <div v-for="r in results" :key="r.name" class="snap-result">
            <div v-if="r.name" class="snap-result-head">
              <i v-if="indexOf(r.name) >= 0">{{ indexOf(r.name) + 1 }}</i>
              <span class="snap-result-name">{{ r.name }}</span>
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
  grid-template-columns: 1fr;
  margin-top: 12px;
  border: var(--line) solid var(--line-color);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--hard-shadow);
}

@media (min-width: 900px) {
  .snap-body.split {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  }
}

.snap-code {
  background: var(--paper-2);
  border-bottom: var(--line) solid var(--line-color);
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
  padding: 6px 16px 10px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--ink-3) !important;
  text-decoration: none !important;
}

.snap-link:hover {
  color: var(--bow) !important;
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
  overflow-x: auto;
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

.snap-result :deep(h1),
.snap-result :deep(h2),
.snap-result :deep(h3),
.snap-result :deep(h4) {
  margin: 0 0 4px;
  padding: 0;
  font-family: var(--vp-font-family-base);
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0;
  border: none;
  background: none;
}

.snap-result :deep(h2::before),
.snap-result :deep(h2::after),
.snap-result :deep(h3::before) {
  display: none;
}

.snap-result :deep(p) {
  margin: 4px 0;
}

.snap-result :deep(hr) {
  margin: 8px 0;
  border: none;
  border-top: var(--line-thin) dashed var(--line-color);
}

.snap-result :deep(div[class*='language-']) {
  margin: 6px 0 0;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
}

.snap-result :deep(div[class*='language-'] > span.lang),
.snap-result :deep(div[class*='language-'] > button.copy) {
  display: none;
}

.snap-result :deep(pre) {
  margin: 0;
  padding: 6px 0 0;
  background: transparent !important;
  font-size: 12.5px;
  overflow-x: auto;
}

.snap-result :deep(:not(pre) > code) {
  padding: 0 4px;
  border: none;
  background: var(--paper-3);
  font-size: 12.5px;
}

.snap-result :deep(code) {
  font-family: var(--vp-font-family-mono);
}

.snap-result :deep(.snap-raw) {
  white-space: pre-wrap;
}

.snap-empty {
  margin: 0;
  padding: 16px;
  color: var(--ink-3);
}
</style>
