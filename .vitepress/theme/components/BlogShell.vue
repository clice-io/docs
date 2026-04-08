<script setup lang="ts">
const props = defineProps<{
  title: string
}>()

function assertText(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`[BlogShell] Required field "${field}" must be a non-empty string.`)
  }
}

assertText(props.title, 'title')
</script>

<template>
  <section class="blog-shell">
    <header class="blog-header">
      <h1>{{ title }}</h1>
    </header>
    <div class="blog-featured-slot">
      <slot name="featured" />
    </div>
    <div class="blog-post-grid">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.blog-shell {
  width: 100%;
  max-width: calc(var(--vp-layout-max-width) - var(--vp-sidebar-width));
  margin: 0 auto;
  padding: 32px 24px 96px;
}

@media (min-width: 768px) {
  .blog-shell {
    padding: 48px 32px 128px;
  }
}

.blog-header {
  text-align: center;
  margin-bottom: 48px;
}

.blog-header h1 {
  margin: 0;
  font-size: 32px;
  line-height: 40px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

@media (min-width: 768px) {
  .blog-header h1 {
    font-size: 48px;
    line-height: 56px;
  }
}

.blog-featured-slot {
  margin-bottom: 24px;
}

.blog-post-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

@media (min-width: 768px) {
  .blog-post-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .blog-post-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
