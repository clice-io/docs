<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// The outline column scrolls on its own, with its scrollbar hidden, and
// VitePress marks the entry of the section being read but never scrolls to
// it: past the window's height a long outline's entries could not be seen.
// Keep the marked entry in view, so the outline follows the page.
const anchor = ref<HTMLElement | null>(null)
let observer: MutationObserver | undefined

onMounted(() => {
  const outline = anchor.value?.closest('.VPDocAside')?.querySelector<HTMLElement>('.VPDocAsideOutline')
  const box = anchor.value?.closest<HTMLElement>('.aside-container')
  if (!outline || !box) return
  observer = new MutationObserver(() => {
    const link = outline.querySelector<HTMLElement>('.outline-link.active')
    if (!link) return
    const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
    // The nav bar lies over the column's top: keep clear of it and of the bottom.
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64
    const from = box.scrollTop + nav + 48
    const to = box.scrollTop + box.clientHeight - 48
    if (top < from || top + link.offsetHeight > to) {
      box.scrollTo({ top: top - (box.clientHeight + nav) / 2, behavior: 'smooth' })
    }
  })
  observer.observe(outline, { subtree: true, attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <span ref="anchor" hidden />
</template>
