// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogPostList from './components/BlogPostList.vue'
import HomeHeroProjects from './components/HomeHeroProjects.vue'
import ProjectShowcase from './components/ProjectShowcase.vue'
import '@fontsource/m-plus-rounded-1c/400.css'
import '@fontsource/m-plus-rounded-1c/500.css'
import '@fontsource/m-plus-rounded-1c/700.css'
import '@fontsource/m-plus-rounded-1c/800.css'
import '@fontsource/m-plus-rounded-1c/900.css'
import '@fontsource/zen-kaku-gothic-new/700.css'
import '@fontsource/zen-kaku-gothic-new/900.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/700.css'
import '@fontsource/noto-sans-sc/900.css'
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
