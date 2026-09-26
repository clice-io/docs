// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogPostList from './components/BlogPostList.vue'
import HomeHeroProjects from './components/HomeHeroProjects.vue'
import HomeLanding from './components/HomeLanding.vue'
import Mermaid from './components/Mermaid.vue'
import SiteFooter from './components/SiteFooter.vue'
import SnapExample from './components/SnapExample.vue'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/500.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/900.css'
import '@fontsource/zen-kaku-gothic-new/700.css'
import '@fontsource/zen-kaku-gothic-new/900.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/700.css'
import '@fontsource/noto-sans-sc/900.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => h(HomeHeroProjects),
      'layout-bottom': () => h(SiteFooter)
    })
  },
  enhanceApp({ app }) {
    app.component('BlogPostList', BlogPostList)
    app.component('HomeLanding', HomeLanding)
    app.component('Mermaid', Mermaid)
    app.component('SnapExample', SnapExample)
  }
} satisfies Theme
