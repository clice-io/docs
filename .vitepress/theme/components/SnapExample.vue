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
  raw: string
}

const props = defineProps<{ data: string }>()

const { lang } = useData()
const zh = computed(() => lang.value.startsWith('zh'))

const payload = computed<Payload>(() => {
  const json = typeof atob === 'function' ? atob(props.data) : Buffer.from(props.data, 'base64').toString('utf8')
  const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as Payload
})

const open = ref(false)
const active = ref(0)

const indexOf = (name: string): number => payload.value.markers.indexOf(name)
const results = computed(() =>
  [...payload.value.results].sort((a, b) => {
    const ia = indexOf(a.name)
    const ib = indexOf(b.name)
    return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib)
  })
)
const single = computed(() => results.value.length === 1 && results.value[0]?.name === '')
</script>

<template>
  <div class="snap" :class="{ open }">
    <button class="snap-toggle" type="button" @click="open = !open">
      <span class="chev" aria-hidden="true">▶</span>
      {{ open ? (zh ? '收起示例' : 'Hide example') : (zh ? '查看示例' : 'Show example') }}
      <span class="snap-feature">{{ payload.feature }}</span>
    </button>
    <div v-if="open" class="snap-body">
      <div class="snap-code">
        <div class="snap-source" v-html="payload.code" />
        <div v-for="file in payload.files" :key="file.name" class="snap-file">
          <span class="snap-file-name">{{ file.name }}</span>
          <div class="snap-source" v-html="file.html" />
        </div>
      </div>
      <div class="snap-results">
        <template v-if="single">
          <div class="snap-result" v-html="results[0]!.html" />
        </template>
        <template v-else-if="results.length > 0">
          <div class="snap-tabs">
            <button
              v-for="(r, i) in results"
              :key="r.name"
              type="button"
              class="snap-tab"
              :class="{ on: i === active }"
              @click="active = i"
            >
              <i v-if="indexOf(r.name) >= 0">{{ indexOf(r.name) + 1 }}</i>{{ r.name }}
            </button>
          </div>
          <div class="snap-result">
            <div v-if="results[active]!.meta" class="snap-meta">{{ results[active]!.meta }}</div>
            <div v-html="results[active]!.html" />
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

.snap-feature {
  padding: 0 8px;
  border-radius: 999px;
  background: var(--straw-soft);
  font-family: var(--vp-font-family-mono);
  font-weight: 400;
  font-size: 11px;
  color: var(--ink-2);
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
  .snap-body {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  }
}

.snap-code {
  background: var(--paper-2);
  border-bottom: var(--line) solid var(--line-color);
}

@media (min-width: 900px) {
  .snap-code {
    border-bottom: none;
    border-right: var(--line) solid var(--line-color);
  }
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

.snap-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 10px 0;
  border-bottom: var(--line-thin) solid var(--line-color);
}

.snap-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border: var(--line-thin) solid var(--line-color);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
  background: var(--paper-2);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}

.snap-tab.on {
  background: var(--panel);
  color: var(--ink);
  margin-bottom: -1px;
}

.dark .snap-tab.on {
  background: var(--paper);
}

.snap-tab i {
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

.snap-result {
  padding: 12px 16px 16px;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
}

.snap-meta {
  margin-bottom: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.snap-result :deep(h1),
.snap-result :deep(h2),
.snap-result :deep(h3),
.snap-result :deep(h4) {
  margin: 0 0 6px;
  padding: 0;
  font-size: 15px;
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

.snap-result :deep(pre) {
  margin: 6px 0;
  padding: 8px 10px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 4px;
  background: var(--paper-2) !important;
  font-size: 12.5px;
  overflow-x: auto;
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
