<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import { VPImage } from 'vitepress/theme'
import ProjectShowcase from './ProjectShowcase.vue'

const route = useRoute()
const { frontmatter } = useData()

const isRoot = computed(() => route.path === '/' || route.path === '/zh/' || route.path === '/zh')
const locale = computed(() => (route.path.startsWith('/zh') ? 'zh' : 'en'))
</script>

<template>
  <ProjectShowcase v-if="isRoot" :locale="locale" />
  <VPImage v-else-if="frontmatter.hero?.image" class="image-src" :image="frontmatter.hero.image" />
</template>
