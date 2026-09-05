<script setup lang="ts">
import { computed } from 'vue'
import icons from '@iconify-json/simple-icons/icons.json'

const props = defineProps<{ name: string; size?: number }>()

const body = computed(() => {
  const icon = (icons as { icons: Record<string, { body: string }> }).icons[props.name]
  return icon ? icon.body : ''
})
</script>

<template>
  <svg
    class="brand-icon"
    :width="size ?? 18"
    :height="size ?? 18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    v-html="body"
  />
</template>
