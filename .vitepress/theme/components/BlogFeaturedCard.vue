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
  assertRequiredTextProps('BlogFeaturedCard', props)
}
</script>

<template>
  <a class="featured-card" :href="props.href" target="_blank" rel="noopener noreferrer">
    <div class="copy">
      <p class="meta">{{ props.date }} · {{ props.author }}</p>
      <h2>{{ props.title }}</h2>
      <p class="summary">{{ props.summary }}</p>
      <span class="cta">{{ props.cta }} <span class="vpi-arrow-right icon"></span></span>
    </div>
    <div class="art" aria-hidden="true" />
  </a>
</template>

<style scoped>
.featured-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
}

.featured-card:hover {
  border-color: var(--vp-c-brand-1);
}

.copy {
  display: flex;
  flex-direction: column;
  padding: 32px;
  flex: 1;
}

.meta {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-bottom: 12px;
}

.copy h2 {
  margin: 0;
  font-size: clamp(2rem, 3.4vw, 3rem);
  line-height: 1.25;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
  transition: color 0.25s;
}

.featured-card:hover h2 {
  color: var(--vp-c-brand-1);
}

.summary {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  flex-grow: 1;
}

.cta {
  display: inline-flex;
  align-items: center;
  margin-top: 24px;
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

.art {
  min-height: 220px;
  background:
    radial-gradient(circle at 30% 75%, rgba(255, 142, 56, 0.2), transparent 44%),
    radial-gradient(circle at 68% 25%, rgba(255, 175, 72, 0.24), transparent 35%),
    linear-gradient(145deg, #fff8ea 0%, #fff3dd 100%);
  border-radius: 0 12px 12px 0;
}

@media (max-width: 899px) {
  .art {
    display: none;
  }
}

@media (min-width: 900px) {
  .featured-card {
    grid-template-columns: minmax(0, 1.24fr) minmax(280px, 0.78fr);
    padding: 0;
  }

  .art {
    min-height: 100%;
    border-radius: 0 12px 12px 0;

  }
}
</style>
