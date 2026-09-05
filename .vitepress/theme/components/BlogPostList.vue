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
  display: inline-block;
  margin: 0;
  padding: 0 16px;
  font-family: var(--clice-font-display);
  font-size: 32px;
  line-height: 40px;
  font-weight: 900;
  color: var(--ink);
  background: linear-gradient(transparent 62%, var(--straw) 62%, var(--straw) 92%, transparent 92%);
}

@media (min-width: 768px) {
  .blog-header h1 {
    font-size: 48px;
    line-height: 56px;
  }
}

.blog-featured-slot {
  margin-bottom: 28px;
}

.featured-card,
.post-card {
  display: block;
  border: var(--line) solid var(--line-color);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: var(--hard-shadow);
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.dark .featured-card,
.dark .post-card {
  background: var(--paper-2);
}

.featured-card:hover,
.post-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--shadow-color);
}

.featured-card {
  display: grid;
  grid-template-columns: 1fr;
}

.copy {
  display: flex;
  flex-direction: column;
  padding: 32px;
}

.meta {
  display: inline-block;
  align-self: flex-start;
  margin-bottom: 14px;
  padding: 0 10px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 999px;
  background: var(--straw-soft);
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
  color: var(--ink);
}

.copy h2 {
  margin: 0 0 16px;
  font-family: var(--clice-font-display);
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  line-height: 1.25;
  font-weight: 900;
  color: var(--ink);
}

.summary {
  margin: 0;
  color: var(--ink-2);
  flex-grow: 1;
}

.featured-card .summary {
  font-size: 16px;
  line-height: 1.6;
}

.art {
  min-height: 220px;
  border-left: var(--line) solid var(--line-color);
  background: #ffffff url("/mascot/featured-reading.webp") center / cover no-repeat;
}

@media (max-width: 899px) {
  .art {
    display: none;
  }
}

@media (min-width: 900px) {
  .featured-card {
    grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.6fr);
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
  height: 100%;
}

.content {
  display: flex;
  flex-direction: column;
  padding: 24px;
  height: 100%;
}

.post-card .meta {
  font-size: 12px;
  margin-bottom: 10px;
}

.title {
  margin: 0 0 12px;
  font-family: var(--clice-font-display);
  font-size: 20px;
  line-height: 1.4;
  font-weight: 900;
  color: var(--ink);
}

.post-card:hover .title,
.featured-card:hover h2 {
  color: var(--bow);
}

.post-card .summary {
  font-size: 14px;
  line-height: 1.6;
}
</style>
