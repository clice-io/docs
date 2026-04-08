<script setup lang="ts">
import {
  assertRequiredTextProps,
  createRequiredTextProp
} from './blogCardProps'

const props = defineProps({
  date: createRequiredTextProp(),
  author: createRequiredTextProp(),
  title: createRequiredTextProp(),
  summary: createRequiredTextProp(),
  href: createRequiredTextProp(),
  cta: createRequiredTextProp()
})

if (import.meta.env.DEV) {
  assertRequiredTextProps('BlogPostCard', props)
}
</script>

<template>
  <a class="post-card" :href="props.href" target="_blank" rel="noopener noreferrer">
    <article class="content">
      <div class="meta">{{ props.date }} · {{ props.author }}</div>
      <h3 class="title">{{ props.title }}</h3>
      <p class="summary">{{ props.summary }}</p>
      <div class="footer">
        <span class="cta">{{ props.cta }}<span class="vpi-arrow-right icon"></span></span>
      </div>
    </article>
  </a>
</template>

<style scoped>
.post-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
  text-decoration: none;
  color: inherit;
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
}

.content {
  display: flex;
  flex-direction: column;
  padding: 24px;
  height: 100%;
}

.meta {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.title {
  margin: 0;
  font-size: 20px;
  line-height: 1.4;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 12px;
  transition: color 0.25s;
}

.post-card:hover .title {
  color: var(--vp-c-brand-1);
}

.summary {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  flex-grow: 1;
}

.footer {
  margin-top: 24px;
  display: flex;
  align-items: center;
}

.cta {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}

.icon {
  margin-left: 4px;
  width: 14px;
  height: 14px;
  fill: currentColor;
  transform: translateY(1px);
}
</style>
