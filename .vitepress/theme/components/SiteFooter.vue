<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { useSidebar } from 'vitepress/theme'
import BrandIcon from './BrandIcon.vue'

type Column = { title: string; links: { text: string; href: string; icon?: string; external?: boolean }[] }

const { lang } = useData()
const { hasSidebar } = useSidebar()
const zh = computed(() => lang.value.startsWith('zh'))
const p = computed(() => (zh.value ? '/zh' : ''))

const columns = computed<Column[]>(() => [
  {
    title: zh.value ? '文档' : 'Docs',
    links: [
      { text: 'clice', href: `${p.value}/clice/guide/what-is-clice` },
      { text: 'catter', href: `${p.value}/catter/guide/what-is-catter` },
      { text: zh.value ? '博客' : 'Blog', href: `${p.value}/blog/` }
    ]
  },
  {
    title: zh.value ? '代码' : 'Code',
    links: [
      { text: 'clice-io/clice', href: 'https://github.com/clice-io/clice', icon: 'github', external: true },
      { text: 'clice-io/catter', href: 'https://github.com/clice-io/catter', icon: 'github', external: true },
      { text: 'clice-io/kotatsu', href: 'https://github.com/clice-io/kotatsu', icon: 'github', external: true }
    ]
  },
  {
    title: zh.value ? '社区' : 'Community',
    links: [
      { text: 'Discord', href: 'https://discord.gg/UgnwYqXWqT', icon: 'discord', external: true },
      { text: zh.value ? '参与贡献' : 'Contributing', href: `${p.value}/clice/dev/contribution` },
      { text: zh.value ? '问题反馈' : 'Issues', href: 'https://github.com/clice-io/clice/issues', external: true }
    ]
  }
])

const license = computed(() => (zh.value ? 'Apache-2.0 许可' : 'Apache-2.0 licensed'))
const other = computed(() => (zh.value ? { text: 'English', href: '/' } : { text: '简体中文', href: '/zh/' }))
</script>

<template>
  <footer class="site-footer" :class="{ 'has-sidebar': hasSidebar }">
    <div class="inner">
      <div class="brand">
        <img class="face" src="/mascot/face-smiling.png" alt="" />
        <div>
          <p class="name">clice.io</p>
          <p class="line">{{ zh ? '下一代 C++ 工具链' : 'Next generation C++ tooling' }}</p>
        </div>
      </div>
      <nav v-for="col in columns" :key="col.title" class="col">
        <p class="title">{{ col.title }}</p>
        <a
          v-for="link in col.links"
          :key="link.href"
          :href="link.href"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
        >
          <BrandIcon v-if="link.icon" :name="link.icon" :size="14" />
          {{ link.text }}
        </a>
      </nav>
    </div>
    <div class="bottom">
      <span>Copyright © 2024-2026 clice.io · {{ license }}</span>
      <a :href="other.href">{{ other.text }}</a>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  z-index: var(--vp-z-index-footer);
  border-top: var(--line) solid var(--line-color);
  background: var(--paper-2);
}

@media (min-width: 960px) {
  .site-footer.has-sidebar {
    padding-left: var(--vp-sidebar-width);
  }
}

@media (min-width: 1440px) {
  .site-footer.has-sidebar {
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width));
  }
}

.inner {
  max-width: 1152px;
  margin: 0 auto;
  padding: 40px 24px 28px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}

@media (min-width: 768px) {
  .inner {
    grid-template-columns: 1.4fr repeat(3, 1fr);
    padding: 48px 32px 32px;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.face {
  width: 56px;
  height: 56px;
  border: var(--line) solid var(--line-color);
  border-radius: 999px;
  background: #ffffff;
  object-fit: cover;
  object-position: center 22%;
}

.brand p {
  margin: 0;
}

.name {
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 18px;
  color: var(--ink);
}

.line {
  font-size: 13px;
  color: var(--ink-2);
}

.col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col .title {
  margin: 0 0 4px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.col a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  font-size: 14px;
  color: var(--ink-2);
  text-decoration: none;
}

.col a:hover {
  color: var(--bow);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.bottom {
  border-top: var(--line-thin) dashed var(--line-color);
  background-image: var(--screentone);
  background-size: 8px 8px;
}

.bottom span,
.bottom a {
  display: inline-block;
  background: var(--paper-2);
  padding: 0 10px;
}

.bottom {
  padding: 14px 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-3);
}

.bottom a {
  color: var(--ink-2);
  text-decoration: none;
}

.bottom a:hover {
  color: var(--bow);
}

.dark .bottom {
  background-image: none;
}
</style>
