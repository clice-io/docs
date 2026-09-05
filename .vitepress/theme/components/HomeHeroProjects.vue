<script setup lang="ts">
import { useData } from 'vitepress'
import { VPImage } from 'vitepress/theme'

const { frontmatter } = useData()
</script>

<template>
  <VPImage v-if="frontmatter.hero?.image" class="image-src" :image="frontmatter.hero.image" />
</template>
