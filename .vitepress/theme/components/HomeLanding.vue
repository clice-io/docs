<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Locale = 'en' | 'zh'

type Accent = 'bow' | 'aqua' | 'straw'

type Project = {
  id: string
  title: string
  label: string
  narration: string
  summary: string
  href: string
  external?: boolean
  more: string
  accent: Accent
}

const props = withDefaults(defineProps<{ locale?: Locale }>(), { locale: 'en' })

const content = {
  en: {
    bubble: 'Next Generation C++ Tooling',
    lead:
      'C++ tooling has long been a mess. We\u2019re building new tools to fix it: a language server that understands your whole project, a build interceptor that gets compile commands out of any build, and the C++23 library beneath them both.',
    start: { text: 'Get started with clice', href: '/clice/guide/quick-start' },
    projectsTitle: 'Projects',
    projects: [
      {
        id: 'clice',
        title: 'clice',
        label: 'language server',
        narration: 'The commands reach clice. It reads the whole project and answers your editor: VS Code, Neovim, Zed.',
        summary: 'Header contexts, C++20 modules and completion inside templates, and it keeps going when Clang crashes.',
        href: '/clice/guide/what-is-clice',
        more: 'Read the docs',
        accent: 'bow'
      },
      {
        id: 'catter',
        title: 'catter',
        label: 'build interceptor',
        narration: 'Somewhere, a build starts: CMake, Meson, Bazel, Make\u2026',
        summary: 'Hooks every process a build spawns to write compile_commands.json for any build system, and profiles the build.',
        href: '/catter/guide/what-is-catter',
        more: 'Read the docs',
        accent: 'aqua'
      },
      {
        id: 'kotatsu',
        title: 'kotatsu',
        label: 'C++23 library',
        narration: 'And holding both of them up: kotatsu.',
        summary: 'A coroutine runtime over libuv, compile-time reflection, typed IPC with LSP bindings, options and CLI.',
        href: 'https://github.com/clice-io/kotatsu',
        external: true,
        more: 'On GitHub',
        accent: 'straw'
      }
    ] satisfies Project[],
    handoff: 'compile_commands.json'
  },
  zh: {
    bubble: '下一代 C++ 工具链',
    lead:
      'C++ 的工具生态一直很混乱。我们正在开发一组全新的 C++ 工具来改变它：一个读懂整个项目的语言服务器，一个能从任何构建里拿到编译命令的拦截器，以及撑起它们俩的 C++23 基础库。',
    start: { text: '上手 clice', href: '/zh/clice/guide/quick-start' },
    projectsTitle: '项目',
    projects: [
      {
        id: 'clice',
        title: 'clice',
        label: '语言服务器',
        narration: '命令交到 clice 手里。它读懂整个项目，回应你的编辑器：VS Code、Neovim、Zed。',
        summary: '头文件上下文、C++20 模块、模板内补全都不在话下，Clang 崩溃也不会拖垮它。',
        href: '/zh/clice/guide/what-is-clice',
        more: '看文档',
        accent: 'bow'
      },
      {
        id: 'catter',
        title: 'catter',
        label: '构建拦截器',
        narration: '某处，一次构建开始了：CMake、Meson、Bazel、Make……',
        summary: '拦截构建派生的每个进程，为任何构建系统生成 compile_commands.json，还能分析构建耗时。',
        href: '/zh/catter/guide/what-is-catter',
        more: '看文档',
        accent: 'aqua'
      },
      {
        id: 'kotatsu',
        title: 'kotatsu',
        label: 'C++23 基础库',
        narration: '而撑着它们俩的，是 kotatsu。',
        summary: '基于 libuv 的协程运行时、编译期反射、带 LSP 绑定的类型化 IPC、选项解析和 CLI。',
        href: 'https://github.com/clice-io/kotatsu',
        external: true,
        more: '去 GitHub',
        accent: 'straw'
      }
    ] satisfies Project[],
    handoff: 'compile_commands.json'
  }
}

const page = computed(() => content[props.locale])

// The project under the pointer; its portrait tilts.
const active = ref('')

// The projects are laid out by a CSS grid and then drawn as one manga page:
// every panel gets a frame whose shared edges lean, leaving slanted gutters,
// and arrows cross the gutters for how the projects hand work to each other.
const mangaPage = ref<HTMLElement>()
const panelEls = new Map<string, HTMLElement>()
const frames = ref<{ id: string; d: string }[]>([])
const arrows = ref<{ line: string; head: string }[]>([])
const labels = ref<{ text: string; x: number; y: number }[]>([])

function setPanel(id: string, el: unknown): void {
  if (el instanceof HTMLElement) panelEls.set(id, el)
  else panelEls.delete(id)
}

type Rect = { id: string; x: number; y: number; w: number; h: number }
type HLine = { a: number; b: number } // y = a + b·x
type VLine = { c: number; d: number } // x = c + d·y

const GUTTER = 14 // visible white between two frames
const LEAN = 18 // how far a gutter drifts from one end to the other

function cross(h: HLine, v: VLine): number[] {
  const x = (v.c + v.d * h.a) / (1 - v.d * h.b)
  return [x, h.a + h.b * x]
}

// A portrait's centre and bottom in page coordinates.
function portraitOf(id: string): { x: number; y: number; bottom: number } | undefined {
  const el = panelEls.get(id)?.querySelector<HTMLElement>('.portrait')
  if (!el) return
  const o = offsetIn(el, mangaPage.value)
  return { x: o.x + el.offsetWidth / 2, y: o.y + el.offsetHeight / 2, bottom: o.y + el.offsetHeight }
}

function arrow(from: number[], to: number[]): { line: string; head: string } {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1])
  const ux = (to[0] - from[0]) / len
  const uy = (to[1] - from[1]) / len
  const base = [to[0] - ux * 12, to[1] - uy * 12]
  const p = (q: number[]) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`
  return {
    line: `M${p(from)}L${p(base)}`,
    head: `M${p(to)}L${p([base[0] - uy * 7, base[1] + ux * 7])}L${p([base[0] + uy * 7, base[1] - ux * 7])}Z`
  }
}

function drawPage(): void {
  const root = mangaPage.value
  if (!root || panelEls.size === 0) return
  const rects: Rect[] = [...panelEls].map(([id, el]) => ({
    id,
    x: el.offsetLeft,
    y: el.offsetTop,
    w: el.offsetWidth,
    h: el.offsetHeight
  }))
  const rows: Rect[][] = []
  for (const r of [...rects].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find((q) => Math.abs(q[0].y - r.y) < 2)
    if (row) row.push(r)
    else rows.push([r])
  }
  const width = root.offsetWidth
  // One slanted gutter between each pair of rows, leaning alternately.
  const rowGutters: HLine[] = []
  for (let i = 0; i + 1 < rows.length; i++) {
    const bottom = Math.max(...rows[i].map((r) => r.y + r.h))
    const top = Math.min(...rows[i + 1].map((r) => r.y))
    const b = ((i % 2 ? -1 : 1) * LEAN) / width
    rowGutters.push({ a: (bottom + top) / 2 - (b * width) / 2, b })
  }
  const half = GUTTER / 2
  const colGutter = new Map<string, VLine>() // keyed by the left panel's id
  const out: { id: string; d: string }[] = []
  rows.forEach((row, ri) => {
    const top = Math.min(...row.map((r) => r.y))
    const bottom = Math.max(...row.map((r) => r.y + r.h))
    for (let ci = 0; ci + 1 < row.length; ci++) {
      const d = ((ci % 2 ? 1 : -1) * LEAN) / (bottom - top)
      const mid = (row[ci].x + row[ci].w + row[ci + 1].x) / 2
      colGutter.set(row[ci].id, { c: mid - (d * (top + bottom)) / 2, d })
    }
    row.forEach((r, ci) => {
      const g = rowGutters
      const topEdge: HLine = ri > 0 ? { a: g[ri - 1].a + half, b: g[ri - 1].b } : { a: r.y, b: 0 }
      const bottomEdge: HLine = ri < rows.length - 1 ? { a: g[ri].a - half, b: g[ri].b } : { a: r.y + r.h, b: 0 }
      const lg = ci > 0 ? colGutter.get(row[ci - 1].id)! : undefined
      const rg = ci < row.length - 1 ? colGutter.get(r.id)! : undefined
      const left: VLine = lg ? { c: lg.c + half, d: lg.d } : { c: r.x, d: 0 }
      const right: VLine = rg ? { c: rg.c - half, d: rg.d } : { c: r.x + r.w, d: 0 }
      const pts = [cross(topEdge, left), cross(topEdge, right), cross(bottomEdge, right), cross(bottomEdge, left)]
      out.push({ id: r.id, d: 'M' + pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L') + 'Z' })
    })
  })
  frames.value = out

  const nextArrows: { line: string; head: string }[] = []
  const nextLabels: { text: string; x: number; y: number }[] = []
  const byId = new Map(rects.map((r) => [r.id, r]))
  const rowOf = (id: string) => rows.findIndex((row) => row.some((r) => r.id === id))
  const gutterY = (i: number, x: number) => rowGutters[i].a + rowGutters[i].b * x

  // catter hands compile_commands.json to clice.
  const from = byId.get('catter')
  const to = byId.get('clice')
  const pa = portraitOf('catter')
  const pb = portraitOf('clice')
  if (from && to && pa && pb) {
    if (rowOf('catter') === rowOf('clice')) {
      // Side by side the two portraits face each other across the gutter; the
      // label sits under the arrow, in the space below both portraits.
      nextArrows.push(arrow([pa.x + 40, pa.y], [pb.x - 40, pb.y]))
      const g = colGutter.get('catter')!
      const y = Math.max(pa.bottom, pb.bottom) + 22
      nextLabels.push({ text: page.value.handoff, x: g.c + g.d * y, y })
    } else {
      // Stacked: a short arrow down across the gutter near the right edge.
      const i = rowOf('catter')
      const x = from.x + from.w - 70
      const y = gutterY(i, x)
      nextArrows.push(arrow([x, y - 20], [x, y + 20]))
      nextLabels.push({ text: page.value.handoff, x: x - 110, y })
    }
  }
  // kotatsu holds up whatever sits directly above it, under that portrait.
  const k = byId.get('kotatsu')
  const ki = rowOf('kotatsu')
  if (k && ki > 0) {
    for (const r of rows[ki - 1]) {
      const pr = portraitOf(r.id)
      if (!pr) continue
      const y = gutterY(ki - 1, pr.x)
      nextArrows.push(arrow([pr.x, y + 18], [pr.x, y - 18]))
    }
  }
  arrows.value = nextArrows
  labels.value = nextLabels
}

// Line icons drawn on a 24 px grid with the site's ink stroke: code brackets
// for clice, a cat for catter, a kotatsu with a mikan.
const LINE_ICONS: Record<string, string> = {
  clice: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>',
  catter:
    '<path d="M4 19V5l4.5 4h7L20 5v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>' +
    '<circle class="dot" cx="9" cy="14" r="1.1"/><circle class="dot" cx="15" cy="14" r="1.1"/>',
  kotatsu:
    '<path d="M2 12h20M4.5 12L3 19.5q2.25-1.4 4.5 0t4.5 0 4.5 0 4.5 0L19.5 12"/>' +
    '<circle cx="12" cy="7.6" r="2.6"/><path d="M12 5l1.6-1.6"/>'
}

// Layout position within `root`. offsetLeft/Top ignore transforms, so the
// bubble's pop-in scale and the figure's sway don't disturb the maths.
function offsetIn(el: HTMLElement, root: HTMLElement | undefined): { x: number; y: number } {
  let x = 0
  let y = 0
  for (let e: HTMLElement | null = el; e && e !== root; e = e.offsetParent as HTMLElement | null) {
    x += e.offsetLeft
    y += e.offsetTop
  }
  return { x, y }
}

// The headline bubble's tail points at the mascot's mouth, so she is the one
// saying it. Where the mouth sits in the hero image, as fractions of it.
const HERO = { src: '/mascot/hero-home.webp', mouth: { x: 0.515, y: 0.198 } }

const hero = ref<HTMLElement>()
const bubble = ref<HTMLElement>()
const figure = ref<HTMLImageElement>()
const tail = ref({ fill: '', line: '' })

// The figure's alpha channel, so the tail can stop at her outline instead of
// being drawn across her.
let alpha: { data: Uint8ClampedArray; w: number; h: number } | undefined

function readAlpha(): void {
  const img = figure.value
  if (!img?.naturalWidth) return
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(img, 0, 0)
  alpha = { data: ctx.getImageData(0, 0, canvas.width, canvas.height).data, w: canvas.width, h: canvas.height }
}

function drawTail(): void {
  const b = bubble.value
  const img = figure.value
  if (!b || !img || !img.offsetHeight) return
  const bo = offsetIn(b, hero.value)
  const io = offsetIn(img, hero.value)
  const mx = io.x + HERO.mouth.x * img.offsetWidth
  const my = io.y + HERO.mouth.y * img.offsetHeight
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
  // Half the tail's width where it meets the bubble: a long reach across the
  // gutter gets a sturdier base so it doesn't read as a thin line.
  const reachGuess = Math.abs(mx - (mx > bo.x ? bo.x + b.offsetWidth : bo.x))
  const half = clamp(reachGuess * 0.06, 13, 24)
  // Side by side the tail leaves the bubble's edge facing her; stacked, its
  // top edge. `edge` is on the bubble's border, `under` just inside it: the
  // fill spans both so the border is erased where the tail joins.
  let edge: number[][]
  let under: number[][]
  const right = bo.x + b.offsetWidth
  const beside = mx < bo.x || mx > right
  if (beside) {
    const y = clamp(my, bo.y + 10 + half, bo.y + b.offsetHeight - 10 - half)
    const [ex, ux] = mx > right ? [right - 1, right - 4] : [bo.x + 1, bo.x + 4]
    edge = [[ex, y - half], [ex, y + half]]
    under = [[ux, y - half], [ux, y + half]]
  } else {
    const x = clamp(mx, bo.x + 24 + half, bo.x + b.offsetWidth - 24 - half)
    edge = [[x - half, bo.y + 1], [x + half, bo.y + 1]]
    under = [[x - half, bo.y + 4], [x + half, bo.y + 4]]
  }
  const cx = (edge[0][0] + edge[1][0]) / 2
  const cy = (edge[0][1] + edge[1][1]) / 2
  const len = Math.hypot(mx - cx, my - cy)
  const ux = (mx - cx) / len
  const uy = (my - cy) / len
  // Walk towards the mouth and stop a little before the first opaque pixel of
  // the figure; without the alpha map, stop just short of the mouth.
  let reach = len - 16
  if (alpha) {
    for (let t = 0; t < len; t += 2) {
      const ix = Math.floor(((cx + ux * t - io.x) / img.offsetWidth) * alpha.w)
      const iy = Math.floor(((cy + uy * t - io.y) / img.offsetHeight) * alpha.h)
      if (ix >= 0 && iy >= 0 && ix < alpha.w && iy < alpha.h && alpha.data[(iy * alpha.w + ix) * 4 + 3] > 96) {
        reach = t - 8
        break
      }
    }
  }
  // Stacked, the figure stands above the bubble and the tail would end at her
  // feet; a short stub pointing up at her reads better.
  reach = beside ? Math.max(reach, 24) : 34
  const tip = [cx + ux * reach, cy + uy * reach]
  // Both sides bow the same way, so the tail curves like a drawn one.
  const bend = reach * 0.12
  const ctrl = (p: number[]) => [(p[0] + tip[0]) / 2 - uy * bend, (p[1] + tip[1]) / 2 + ux * bend]
  const pt = (p: number[]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`
  const sides = `M${pt(edge[0])}Q${pt(ctrl(edge[0]))} ${pt(tip)}Q${pt(ctrl(edge[1]))} ${pt(edge[1])}`
  tail.value = {
    line: sides,
    fill: `M${pt(under[0])}L${sides.slice(1)}L${pt(under[1])}Z`
  }
}

function onFigureLoad(): void {
  readAlpha()
  drawTail()
}

function redraw(): void {
  drawTail()
  drawPage()
}

let observer: ResizeObserver | undefined


onMounted(() => {
  if (figure.value?.complete) readAlpha()
  redraw()
  observer = new ResizeObserver(redraw)
  if (hero.value) observer.observe(hero.value)
  if (mangaPage.value) observer.observe(mangaPage.value)
  document.fonts?.ready.then(redraw)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="landing">
    <section ref="hero" class="hero koma">
      <div class="hero-figure">
        <img ref="figure" :src="HERO.src" alt="clice mascot" @load="onFigureLoad" />
      </div>
      <div class="hero-copy">
        <div ref="bubble" class="bubble">
          <h1>{{ page.bubble }}</h1>
          <p class="lead">{{ page.lead }}</p>
        </div>
        <div class="actions">
          <a class="btn brand" :href="page.start.href">{{ page.start.text }} →</a>
        </div>
      </div>
      <svg class="tail" aria-hidden="true">
        <path class="tail-fill" :d="tail.fill" />
        <path class="tail-line" :d="tail.line" />
      </svg>
    </section>

    <h2 id="projects" class="section-title">{{ page.projectsTitle }}</h2>
    <section ref="mangaPage" class="manga-page" :class="{ framed: frames.length > 0 }">
      <svg class="page-frames" aria-hidden="true">
        <path v-for="f in frames" :key="f.id" :d="f.d" />
      </svg>
      <article
        v-for="project in page.projects"
        :key="project.id"
        :ref="(el) => setPanel(project.id, el)"
        class="panel"
        :class="[project.id, project.accent, { lit: active === project.id }]"
        @mouseenter="active = project.id"
        @mouseleave="active = ''"
      >
        <p class="narration">{{ project.narration }}</p>
        <div class="panel-main">
          <div class="portrait">
            <svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true" v-html="LINE_ICONS[project.id]" />
          </div>
          <div class="panel-body">
            <div class="project-head">
              <h3>
                <a
                  class="stretch"
                  :href="project.href"
                  :target="project.external ? '_blank' : undefined"
                  :rel="project.external ? 'noopener noreferrer' : undefined"
                >{{ project.title }}</a>
              </h3>
              <span class="tag">{{ project.label }}</span>
            </div>
            <p class="summary">{{ project.summary }}</p>
            <span class="more" aria-hidden="true">{{ project.more }} {{ project.external ? '↗' : '→' }}</span>
          </div>
        </div>
      </article>
      <svg class="page-arrows" aria-hidden="true">
        <g v-for="(ar, i) in arrows" :key="i">
          <path class="halo" :d="ar.line" />
          <path class="halo" :d="ar.head" />
          <path class="shaft" :d="ar.line" />
          <path class="head" :d="ar.head" />
        </g>
      </svg>
      <span
        v-for="l in labels"
        :key="l.text + l.x"
        class="arrow-label"
        :style="{ left: `${l.x}px`, top: `${l.y}px` }"
      >{{ l.text }}</span>
    </section>

  </div>
</template>

<style scoped>
.landing {
  max-width: 1152px;
  margin: 0 auto;
  padding: 40px 24px 96px;
}

@media (min-width: 960px) {
  .landing {
    padding: 56px 32px 128px;
  }
}

.koma {
  border: var(--line) solid var(--line-color);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: var(--hard-shadow);
}

.dark .koma {
  background: var(--paper-2);
}

/* hero */

.hero {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  overflow: hidden;
  animation: rise 0.5s ease both;
}

.hero-figure {
  position: relative;
  background:
    var(--screentone) 0 0 / 10px 10px,
    #ffffff;
  border-bottom: var(--line) solid var(--line-color);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 24px 24px 0;
  min-height: 320px;
}

.hero-figure img {
  display: block;
  height: 300px;
  animation: sway 6s ease-in-out infinite;
  transform-origin: 50% 100%;
}

.hero-copy {
  padding: 28px 24px 32px;
}

/* She says the whole introduction: one balloon holds the headline and the
   lead, filling the column so its edge (and the tail's root) sits by her. */
.bubble {
  position: relative;
  padding: 20px 24px 22px;
  border: var(--line) solid var(--line-color);
  border-radius: 18px;
  background: var(--paper);
  animation: pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) 0.2s both;
}

.dark .bubble {
  background: var(--paper);
}

.tail {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  animation: fade-in 0.2s ease 0.5s both;
}

.tail-fill {
  fill: var(--paper);
}

.tail-line {
  fill: none;
  stroke: var(--line-color);
  stroke-width: var(--line);
  stroke-linejoin: round;
}

.bubble h1 {
  margin: 0;
  text-wrap: balance;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 30px;
  line-height: 1.2;
  color: var(--ink);
}

.lead {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.7;
  color: var(--ink-2);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  border: var(--line) solid var(--line-color);
  border-radius: 999px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 14px;
  text-decoration: none;
  box-shadow: var(--hard-shadow-sm);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
}

.btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--shadow-color);
}

.btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--shadow-color);
}

.btn.brand {
  background: var(--bow);
  color: #ffffff;
}

.dark .btn.brand {
  color: #1d212d;
}

/* Side by side the copy leads on the left and she stands on the right, so
   she doesn't sit directly under the navbar logo. */
@media (min-width: 768px) {
  .hero {
    grid-template-columns: 1fr 340px;
  }

  .hero-figure {
    order: 2;
    border-bottom: none;
    border-left: var(--line) solid var(--line-color);
    padding: 32px 24px 0;
  }

  .hero-figure img {
    height: 460px;
  }

  .hero-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 40px 44px;
  }

  .bubble h1 {
    font-size: 32px;
  }
}

@media (min-width: 960px) {
  .bubble {
    padding: 26px 32px 28px;
  }

  .bubble h1 {
    font-size: 38px;
  }
}

/* section titles */

.section-title {
  position: relative;
  scroll-margin-top: calc(var(--vp-nav-height) + 24px);
  margin: 56px 0 20px;
  padding: 4px 0 4px 16px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 22px;
  color: var(--ink);
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  background: var(--bow);
  border: var(--line) solid var(--line-color);
  box-sizing: border-box;
}

/* projects: one manga page, a panel per project */

.manga-page {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 40px;
}

@media (min-width: 960px) {
  .manga-page {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    grid-template-areas:
      'catter clice'
      'kotatsu kotatsu';
    gap: 34px 38px;
  }

  .panel.catter {
    grid-area: catter;
  }

  .panel.clice {
    grid-area: clice;
  }

  .panel.kotatsu {
    grid-area: kotatsu;
  }
}

/* Panel order follows the story: the build, then clice, then what holds
   them up. */
.panel.catter {
  order: 1;
}

.panel.clice {
  order: 2;
}

.panel.kotatsu {
  order: 3;
}

.page-frames,
.page-arrows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.page-frames path {
  fill: var(--panel);
  stroke: var(--line-color);
  stroke-width: 2.5;
  stroke-linejoin: round;
}

.dark .page-frames path {
  fill: var(--paper-2);
}

.page-arrows {
  z-index: 2;
}

.page-arrows .halo {
  fill: var(--panel);
  stroke: var(--panel);
  stroke-width: 9;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.dark .page-arrows .halo {
  fill: var(--paper-2);
  stroke: var(--paper-2);
}

.page-arrows .shaft {
  fill: none;
  stroke: var(--ink);
  stroke-width: 3;
  stroke-linecap: round;
}

.page-arrows .head {
  fill: var(--ink);
  stroke: var(--ink);
  stroke-width: 1.5;
  stroke-linejoin: round;
}

/* What one project hands to the next, pinned to the arrow between them. */
.arrow-label {
  position: absolute;
  z-index: 3;
  padding: 1px 8px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 4px;
  background: var(--panel);
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  font-size: 11px;
  line-height: 18px;
  color: var(--ink);
  white-space: nowrap;
  transform: translate(-50%, -50%) rotate(-3deg);
}

.dark .arrow-label {
  background: var(--paper-2);
}

.panel {
  position: relative;
  z-index: 1;
  padding: 20px 22px 18px;
}

/* Until the frames are measured (and without JS) a plain border stands in. */
.manga-page:not(.framed) .panel {
  border: var(--line) solid var(--line-color);
  border-radius: var(--radius);
  background: var(--panel);
}

.dark .manga-page:not(.framed) .panel {
  background: var(--paper-2);
}

.bow {
  --accent: var(--bow);
}

.aqua {
  --accent: var(--aqua);
}

.straw {
  --accent: var(--straw);
}

/* A narration box, square-cornered, in the top corner of the panel. */
.narration {
  width: fit-content;
  max-width: 100%;
  margin: 0 0 16px;
  padding: 6px 12px;
  border: var(--line-thin) solid var(--line-color);
  border-left: 6px solid var(--accent);
  background: var(--paper);
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink);
}

.panel-main {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

/* catter faces clice across the gutter, so its portrait sits on the right. */
.panel.catter .panel-main {
  flex-direction: row-reverse;
}

.panel-body {
  flex: 1;
  min-width: 0;
}

.line-icon {
  display: block;
  fill: none;
  stroke: var(--ink);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.line-icon :deep(.dot) {
  fill: var(--ink);
  stroke: none;
}

/* A character's portrait frame; it tilts a little under the pointer. */
.portrait {
  position: relative;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border: var(--line) solid var(--line-color);
  border-radius: 50%;
  background: var(--paper);
  box-shadow: 3px 3px 0 var(--accent);
  transition: transform 0.15s ease;
}

.portrait .line-icon {
  width: 34px;
  height: 34px;
}

.lit .portrait {
  transform: rotate(-6deg);
}

.project-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}

.panel h3 {
  margin: 0;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 28px;
  line-height: 1.2;
}

.panel h3 a {
  color: var(--ink);
  text-decoration: none;
}

/* The title link covers the whole panel. */
.stretch::after {
  content: '';
  position: absolute;
  inset: 0;
}

.tag {
  padding: 0 10px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 999px;
  background: var(--straw-soft);
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  color: var(--ink);
  white-space: nowrap;
}

.summary {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: var(--ink-2);
}

/* The whole panel is the link; this only says where it goes. */
.more {
  display: inline-block;
  margin-top: 12px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 13px;
  color: var(--bow);
  transition: transform 0.12s ease;
}

.lit .more {
  transform: translateX(4px);
}

/* kotatsu's panel runs the full width: its name on the left, the
   description beside it. */
@media (min-width: 960px) {
  .panel.kotatsu .panel-body {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    grid-template-areas:
      'head summary'
      'head more';
    column-gap: 32px;
  }

  .panel.kotatsu .project-head {
    grid-area: head;
    align-self: center;
  }

  .panel.kotatsu .summary,
  .panel.kotatsu .more {
    padding-left: 28px;
    border-left: var(--line-thin) dashed var(--line-color);
  }

  .panel.kotatsu .summary {
    grid-area: summary;
    margin: 0;
    align-self: end;
  }

  .panel.kotatsu .more {
    grid-area: more;
    justify-self: start;
    margin: 0;
    padding-top: 12px;
  }
}

/* Narrow screens: the portrait sits beside the name only, and everything
   below uses the panel's full width. */
@media (max-width: 639px) {
  .panel-main {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0 14px;
  }

  .panel.catter .panel-main {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .panel.catter .portrait {
    grid-column: 2;
    grid-row: 1;
  }

  .panel-body {
    display: contents;
  }

  .project-head {
    align-self: center;
  }

  .summary,
  .more {
    grid-column: 1 / -1;
  }

  .portrait {
    width: 56px;
    height: 56px;
  }

  .portrait .line-icon {
    width: 28px;
    height: 28px;
  }
}

/* motion */

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.85);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes sway {
  0%,
  100% {
    transform: translateY(0) rotate(0);
  }

  50% {
    transform: translateY(-4px) rotate(0.6deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero,
  .bubble,
  .tail,
  .hero-figure img {
    animation: none;
  }
}
</style>
