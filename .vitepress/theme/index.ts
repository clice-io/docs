// https://vitepress.dev/guide/custom-theme
import { h, onMounted } from 'vue'
import { onContentUpdated, useRouter, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogPostList from './components/BlogPostList.vue'
import HomeLanding from './components/HomeLanding.vue'
import Mermaid from './components/Mermaid.vue'
import OutlineFollow from './components/OutlineFollow.vue'
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

// A project's home page redirects to its "What is" page: the built page
// refreshes to it (see transformPageData in config.mts); a navigation within
// the site, and the dev server, go there here.
const PROJECT_HOME = /^(\/zh)?\/(clice|catter|xclang)\/?$/

function entryFor(path: string): string {
  const m = PROJECT_HOME.exec(path)
  return m ? `${m[1] ?? ''}/${m[2]}/guide/what-is-${m[2]}` : ''
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'layout-bottom': () => h(SiteFooter),
      'aside-outline-after': () => h(OutlineFollow)
    })
  },
  setup() {
    const router = useRouter()
    const before = router.onBeforeRouteChange
    router.onBeforeRouteChange = (to) => {
      const entry = entryFor(new URL(to, location.href).pathname)
      if (entry) {
        void router.go(entry)
        return false
      }
      return before?.(to)
    }
    onMounted(() => {
      const entry = entryFor(location.pathname)
      if (entry) location.replace(entry)
    })

    // A page's `<video autoplay muted>` (clice's what-is-clice demos) is put
    // in by Vue, not by the HTML parser, and Chrome then leaves it paused,
    // though a muted video may autoplay: start it once the page is in.
    onContentUpdated(() => {
      for (const video of document.querySelectorAll<HTMLVideoElement>('.vp-doc video[autoplay]')) {
        if (video.hasAttribute('muted')) video.muted = true
        if (video.paused) video.play().catch(() => {})
      }
    })
  },
  enhanceApp({ app }) {
    app.component('BlogPostList', BlogPostList)
    app.component('HomeLanding', HomeLanding)
    app.component('Mermaid', Mermaid)
    app.component('SnapExample', SnapExample)
  }
} satisfies Theme
