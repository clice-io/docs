<script setup lang="ts">
import { computed } from 'vue'

type BlogPostItem = {
  publishedAt: string
  author: string
  title: string
  summary: string
  href: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isBlogPostItem(value: unknown): value is BlogPostItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    isNonEmptyString(record.publishedAt) &&
    isNonEmptyString(record.author) &&
    isNonEmptyString(record.title) &&
    isNonEmptyString(record.summary) &&
    isNonEmptyString(record.href)
  )
}

const props = defineProps<{
  title: string
  posts: BlogPostItem[]
}>()

if (import.meta.env.DEV) {
  if (!isNonEmptyString(props.title)) {
    throw new Error('[BlogPostList] Required field "title" must be a non-empty string.')
  }

  if (!Array.isArray(props.posts) || props.posts.length === 0) {
    throw new Error('[BlogPostList] Required field "posts" must be a non-empty array.')
  }

  for (const [index, post] of props.posts.entries()) {
    if (!isBlogPostItem(post)) {
      throw new Error(
        `[BlogPostList] Item at index ${index} in "posts" has invalid or empty required fields.`
      )
    }
  }
}

const sortedPosts = computed<BlogPostItem[]>(() =>
  [...props.posts].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
)

const featuredPost = computed<BlogPostItem>(() => sortedPosts.value[0]!)
const regularPosts = computed<BlogPostItem[]>(() => sortedPosts.value.slice(1))
</script>

<template>
  <section class="blog-shell">
    <header class="blog-header">
      <h1>{{ props.title }}</h1>
    </header>
    <div class="blog-featured-slot">
      <a
        class="featured-card"
        :href="featuredPost.href"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="copy">
          <p class="meta">{{ featuredPost.publishedAt }} · {{ featuredPost.author }}</p>
          <h2>{{ featuredPost.title }}</h2>
          <p class="summary">{{ featuredPost.summary }}</p>
        </div>
        <div class="art" aria-hidden="true" />
      </a>
    </div>
    <div class="blog-post-grid">
      <a
        v-for="post in regularPosts"
        :key="post.href"
        class="post-card"
        :href="post.href"
        target="_blank"
        rel="noopener noreferrer"
      >
        <article class="content">
          <div class="meta">{{ post.publishedAt }} · {{ post.author }}</div>
          <h3 class="title">{{ post.title }}</h3>
          <p class="summary">{{ post.summary }}</p>
        </article>
      </a>
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
  color: var(--vp-c-text-2);
  flex-grow: 1;
}

.featured-card .summary {
  font-size: 16px;
  line-height: 1.6;
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

.post-card .meta {
  font-size: 13px;
  margin-bottom: 8px;
}

.title {
  margin: 0 0 12px;
  font-size: 20px;
  line-height: 1.4;
  font-weight: 600;
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

.post-card:hover .title {
  color: var(--vp-c-brand-1);
}

.post-card .summary {
  font-size: 14px;
  line-height: 1.6;
}
</style>
