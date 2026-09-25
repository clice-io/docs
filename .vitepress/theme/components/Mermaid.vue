<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{ id: string; graph: string }>()

const { isDark } = useData()
const svg = ref('')

// Imported on first use, so pages without a diagram never fetch mermaid.
async function render(): Promise<void> {
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({ startOnLoad: false, theme: isDark.value ? 'dark' : 'default' })
  const { svg: out } = await mermaid.render(props.id, decodeURIComponent(props.graph))
  svg.value = out
}

onMounted(render)
watch(isDark, render)
</script>

<template>
  <div class="mermaid" v-html="svg" />
</template>
