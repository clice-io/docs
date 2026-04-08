<script setup lang="ts">
function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

const props = defineProps({
  date: {
    type: String,
    required: true,
    validator: isNonEmptyString
  },
  author: {
    type: String,
    required: true,
    validator: isNonEmptyString
  },
  title: {
    type: String,
    required: true,
    validator: isNonEmptyString
  },
  summary: {
    type: String,
    required: true,
    validator: isNonEmptyString
  },
  href: {
    type: String,
    required: true,
    validator: isNonEmptyString
  },
  cta: {
    type: String,
    required: true,
    validator: isNonEmptyString
  }
})

function assertText(value: unknown, field: string): void {
  if (!isNonEmptyString(value)) {
    throw new Error(`[BlogPostCard] Required field "${field}" must be a non-empty string.`)
  }
}

if (import.meta.env.DEV) {
  assertText(props.date, 'date')
  assertText(props.author, 'author')
  assertText(props.title, 'title')
  assertText(props.summary, 'summary')
  assertText(props.href, 'href')
  assertText(props.cta, 'cta')
}
</script>

<template>
  <a class="post-card" :href="href" target="_blank" rel="noopener noreferrer">
    <article class="content">
      <div class="meta">{{ date }} · {{ author }}</div>
      <h3 class="title">{{ title }}</h3>
      <p class="summary">{{ summary }}</p>
      <div class="footer">
        <span class="cta">{{ cta }}<span class="vpi-arrow-right icon"></span></span>
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
