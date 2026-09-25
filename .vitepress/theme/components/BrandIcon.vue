<script setup lang="ts">
import { computed } from 'vue'
import { data as icons } from '../brand-icons.data'

const props = defineProps<{ name: string; size?: number }>()

const body = computed(() => icons[props.name] ?? '')
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
