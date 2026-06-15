<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vitepress'
import ProjectShowcase from './ProjectShowcase.vue'

const route = useRoute()

const isRoot = computed(() => route.path === '/' || route.path === '/zh/' || route.path === '/zh')
const locale = computed(() => (route.path.startsWith('/zh') ? 'zh' : 'en'))
</script>

<template>
  <ProjectShowcase v-if="isRoot" :locale="locale" />
</template>
