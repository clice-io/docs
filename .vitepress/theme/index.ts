// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogPostList from './components/BlogPostList.vue'
import HomeHeroProjects from './components/HomeHeroProjects.vue'
import ProjectShowcase from './components/ProjectShowcase.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => h(HomeHeroProjects)
    })
  },
  enhanceApp({ app }) {
    app.component('BlogPostList', BlogPostList)
    app.component('ProjectShowcase', ProjectShowcase)
  }
} satisfies Theme
