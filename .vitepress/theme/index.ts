// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogFeaturedCard from './components/BlogFeaturedCard.vue'
import BlogPostCard from './components/BlogPostCard.vue'
import BlogShell from './components/BlogShell.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app }) {
    app.component('BlogShell', BlogShell)
    app.component('BlogFeaturedCard', BlogFeaturedCard)
    app.component('BlogPostCard', BlogPostCard)
  }
} satisfies Theme
