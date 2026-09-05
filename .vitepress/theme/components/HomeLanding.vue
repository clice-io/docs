<script setup lang="ts">
import { computed } from 'vue'
import BrandIcon from './BrandIcon.vue'

type Locale = 'en' | 'zh'

type Face = 'surprised' | 'skeptical' | 'smiling'

type Project = {
  id: string
  face: Face
  title: string
  label: string
  summary: string
  href: string
  external?: boolean
  accent: 'bow' | 'aqua' | 'straw'
}

type QA = {
  face: Face
  question: string
  title: string
  lines: string[]
}

const props = withDefaults(defineProps<{ locale?: Locale }>(), { locale: 'en' })

const content = {
  en: {
    kicker: 'clice.io',
    bubble: 'Next Generation C++ Tooling',
    lead:
      'A language server on the surface, a real-time compilation scheduler underneath. It drives Clang over your whole project and serves editors, linters, indexers and agents from the same engine.',
    primary: { text: 'Start with clice', href: '/clice/guide/what-is-clice' },
    secondary: { text: 'Read the Blog', href: '/blog/' },
    worksWith: 'Works with',
    runsOn: 'Runs on',
    projectsTitle: 'Projects',
    projects: [
      {
        id: 'clice',
        face: 'smiling',
        title: 'clice',
        label: 'language server · scheduler',
        summary:
          'Compiles, indexes and answers queries for a whole project from one multi-process scheduler. The LSP is its first consumer; lint, index, query and doc follow.',
        href: '/clice/guide/what-is-clice',
        accent: 'bow'
      },
      {
        id: 'catter',
        face: 'surprised',
        title: 'catter',
        label: 'build interceptor',
        summary:
          'Hooks every process a build spawns to capture commands, generate compile_commands.json from any build system, profile the build and patch invocations.',
        href: '/catter/guide/what-is-catter',
        accent: 'aqua'
      },
      {
        id: 'kotatsu',
        face: 'skeptical',
        title: 'kotatsu',
        label: 'C++23 toolkit',
        summary:
          'The infrastructure clice is built on: a coroutine runtime over libuv, compile-time reflection, attribute-driven codecs, typed IPC with LSP bindings, options and CLI.',
        href: 'https://github.com/clice-io/kotatsu',
        external: true,
        accent: 'straw'
      }
    ] satisfies Project[],
    qaTitle: 'Why Another One?',
    qa: [
      {
        face: 'skeptical',
        question: 'Isn\u2019t clangd good enough?',
        title: 'It never solved the hard ones.',
        lines: [
          'A file with several compile commands, a header that only makes sense inside its includer, a Clang crash taking the whole server down: clangd has carried these since day one.',
          'clice answers them with compilation contexts, a multi-process design that keeps serving queries while a worker restarts, a dynamic module graph with shared PCH and PCM caches, and a pseudo-instantiator that keeps completion useful inside templates.'
        ]
      },
      {
        face: 'surprised',
        question: 'Why put a scheduler inside a language server?',
        title: 'Because Clang never had one.',
        lines: [
          'Clang exposes a compiler, not the act of compiling a project. The language server is only the first consumer of clice\u2019s scheduler.',
          'clice lint, index, query, doc and format run on the same engine, and a cross-TU cache lets them skip the work clang-tidy repeats for every header.'
        ]
      },
      {
        face: 'smiling',
        question: 'Can I use it today?',
        title: 'Install the extension and go.',
        lines: [
          'The binary ships inside the VS Code extension for Windows, Linux and macOS on x64 and arm64. Nightlies roll out every day, and Neovim and Zed have first-party clients too.'
        ]
      }
    ] satisfies QA[]
  },
  zh: {
    kicker: 'clice.io',
    bubble: '下一代 C++ 工具链',
    lead:
      '表面上是一个语言服务器，内核是一个实时的编译调度器。它在整个项目上驱动 Clang，用同一个引擎服务编辑器、静态检查、索引和 Agent。',
    primary: { text: '从 clice 开始', href: '/zh/clice/guide/what-is-clice' },
    secondary: { text: '读博客', href: '/zh/blog/' },
    worksWith: '支持的编辑器',
    runsOn: '运行平台',
    projectsTitle: '项目',
    projects: [
      {
        id: 'clice',
        face: 'smiling',
        title: 'clice',
        label: '语言服务器 · 调度器',
        summary:
          '用一个多进程调度器编译、索引整个项目并回答查询。LSP 是它的第一个消费者，lint、index、query 和 doc 紧随其后。',
        href: '/zh/clice/guide/what-is-clice',
        accent: 'bow'
      },
      {
        id: 'catter',
        face: 'surprised',
        title: 'catter',
        label: '构建拦截器',
        summary:
          '拦截构建过程中派生的每一个进程，捕获命令、从任意构建系统生成 compile_commands.json、分析构建耗时并改写调用。',
        href: '/zh/catter/guide/what-is-catter',
        accent: 'aqua'
      },
      {
        id: 'kotatsu',
        face: 'skeptical',
        title: 'kotatsu',
        label: 'C++23 工具箱',
        summary:
          'clice 赖以构建的基础设施：基于 libuv 的协程运行时、编译期反射、属性驱动的编解码、带 LSP 绑定的类型化 IPC、选项解析和 CLI。',
        href: 'https://github.com/clice-io/kotatsu',
        external: true,
        accent: 'straw'
      }
    ] satisfies Project[],
    qaTitle: '为什么还要再写一个？',
    qa: [
      {
        face: 'skeptical',
        question: 'clangd 不是够用了吗？',
        title: '难的它一个都没解决。',
        lines: [
          '一个文件对应多条编译命令、头文件只有在包含它的地方才有意义、Clang 一崩整个服务器跟着没，这些 clangd 从第一天起就背着。',
          'clice 用编译上下文、worker 重启时查询照常回答的多进程架构、落盘共享 PCH / PCM 缓存的动态模块图、以及让模板内部补全依然好用的伪实例化器，把它们一个个解决掉。'
        ]
      },
      {
        face: 'surprised',
        question: '语言服务器里为什么要塞一个调度器？',
        title: '因为 Clang 从来没有过。',
        lines: [
          'Clang 提供了编译器，却没有提供「编译一个项目」这件事本身的抽象。语言服务器只是 clice 调度器的第一个消费者。',
          'clice lint、index、query、doc、format 跑在同一个引擎上，跨 TU 缓存让它们跳过 clang-tidy 对每个头文件重复做的工作。'
        ]
      },
      {
        face: 'smiling',
        question: '现在能用了吗？',
        title: '装上插件就能用。',
        lines: [
          '二进制随 VS Code 插件打包，覆盖 Windows / Linux / macOS 的 x64 和 arm64。每天发 nightly，Neovim 和 Zed 也有官方客户端。'
        ]
      }
    ] satisfies QA[]
  }
}

const page = computed(() => content[props.locale])

const editors = [
  { name: 'VS Code', icon: 'visualstudiocode', href: 'https://marketplace.visualstudio.com/items?itemName=clice-io.clice' },
  { name: 'Neovim', icon: 'neovim', href: 'https://github.com/clice-io/clice/tree/main/editors/nvim' },
  { name: 'Zed', icon: 'zedindustries', href: 'https://github.com/clice-io/clice/tree/main/editors/zed' }
]

const platforms = [
  { name: 'Windows', icon: 'windows' },
  { name: 'Linux', icon: 'linux' },
  { name: 'macOS', icon: 'apple' }
]
</script>

<template>
  <div class="landing">
    <section class="hero koma">
      <div class="hero-figure">
        <img src="/mascot/full-body.png" alt="clice mascot" />
      </div>
      <div class="hero-copy">
        <p class="kicker">{{ page.kicker }}</p>
        <div class="bubble">
          <h1>{{ page.bubble }}</h1>
        </div>
        <p class="lead">{{ page.lead }}</p>
        <div class="actions">
          <a class="btn brand" :href="page.primary.href">{{ page.primary.text }}</a>
          <a class="btn alt" :href="page.secondary.href">{{ page.secondary.text }}</a>
        </div>
        <div class="support">
          <div class="support-row">
            <span class="support-label">{{ page.worksWith }}</span>
            <a v-for="e in editors" :key="e.name" class="chip link" :href="e.href" target="_blank" rel="noopener noreferrer">
              <BrandIcon :name="e.icon" :size="15" />{{ e.name }}
            </a>
          </div>
          <div class="support-row">
            <span class="support-label">{{ page.runsOn }}</span>
            <span v-for="pl in platforms" :key="pl.name" class="chip">
              <BrandIcon :name="pl.icon" :size="15" />{{ pl.name }}
            </span>
            <span class="chip arch">x64</span>
            <span class="chip arch">arm64</span>
          </div>
        </div>
      </div>
    </section>

    <h2 class="section-title">{{ page.projectsTitle }}</h2>
    <section class="projects">
      <a
        v-for="project in page.projects"
        :key="project.id"
        class="koma project"
        :class="project.accent"
        :href="project.href"
        :target="project.external ? '_blank' : undefined"
        :rel="project.external ? 'noopener noreferrer' : undefined"
      >
        <div class="project-head">
          <img class="avatar" :src="`/mascot/face-${project.face}.png`" :alt="project.face" />
          <h3>{{ project.title }}</h3>
          <span class="tag">{{ project.label }}</span>
        </div>
        <p>{{ project.summary }}</p>
        <span class="arrow" aria-hidden="true">→</span>
      </a>
    </section>

    <h2 class="section-title">{{ page.qaTitle }}</h2>
    <section class="qa">
      <div v-for="(item, i) in page.qa" :key="item.face" class="qa-row" :class="{ flip: i % 2 === 1 }">
        <div class="caption">
          <span class="q">Q</span>
          <p>{{ item.question }}</p>
        </div>
        <div class="koma face">
          <img :src="`/mascot/face-${item.face}.png`" :alt="item.face" />
          <span class="num">{{ i + 1 }}</span>
        </div>
        <div class="answer">
          <h3>{{ item.title }}</h3>
          <p v-for="line in item.lines" :key="line">{{ line }}</p>
        </div>
      </div>
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
  width: 180px;
  animation: sway 6s ease-in-out infinite;
  transform-origin: 50% 100%;
}

.hero-copy {
  padding: 28px 24px 32px;
}

.kicker {
  margin: 0 0 12px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--bow);
}

.bubble {
  position: relative;
  display: inline-block;
  padding: 14px 22px;
  border: var(--line) solid var(--line-color);
  border-radius: 18px;
  background: var(--paper);
  animation: pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) 0.2s both;
}

.dark .bubble {
  background: var(--paper);
}

.bubble::before,
.bubble::after {
  content: '';
  position: absolute;
  top: 22px;
  left: -14px;
  border-style: solid;
  border-width: 0 14px 12px 0;
  border-color: transparent var(--line-color) transparent transparent;
}

.bubble::after {
  left: -9px;
  top: 24px;
  border-width: 0 10px 8px 0;
  border-color: transparent var(--paper) transparent transparent;
}

.bubble h1 {
  margin: 0;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 30px;
  line-height: 1.2;
  color: var(--ink);
}

.lead {
  margin: 20px 0 0;
  max-width: 560px;
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
  display: inline-block;
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

.btn.alt {
  background: var(--straw);
  color: #2b3040;
}

@media (min-width: 768px) {
  .hero {
    grid-template-columns: 300px 1fr;
  }

  .hero-figure {
    border-bottom: none;
    border-right: var(--line) solid var(--line-color);
    padding: 32px 24px 0;
  }

  .hero-figure img {
    width: 220px;
  }

  .hero-copy {
    padding: 40px 40px 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .bubble h1 {
    font-size: 38px;
  }
}

/* works with / runs on */

.support {
  margin-top: 26px;
  padding-top: 18px;
  border-top: var(--line-thin) dashed var(--line-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.support-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.support-label {
  min-width: 78px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: var(--line-thin) solid var(--line-color);
  border-radius: 999px;
  background: var(--paper);
  font-size: 12px;
  font-weight: 700;
  line-height: 24px;
  color: var(--ink);
  text-decoration: none;
}

.chip.arch {
  background: var(--straw-soft);
}

.chip.link:hover {
  border-color: var(--bow);
  color: var(--bow);
}

/* section titles */

.section-title {
  position: relative;
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

/* projects */

.projects {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .projects {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.project {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 22px 22px 26px;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.project::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 10px;
  border-right: var(--line) solid var(--line-color);
  background: var(--accent);
}

.project.bow {
  --accent: var(--bow);
}

.project.aqua {
  --accent: var(--aqua);
}

.project.straw {
  --accent: var(--straw);
}

.project:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--shadow-color);
}

.project-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin-left: 8px;
}

.avatar {
  width: 40px;
  height: 40px;
  border: var(--line) solid var(--line-color);
  border-radius: 999px;
  background: #ffffff;
  object-fit: cover;
  object-position: center 22%;
}

.project h3 {
  margin: 0;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 24px;
  color: var(--ink);
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

.project p {
  margin: 12px 0 0 8px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--ink-2);
  flex-grow: 1;
}

.arrow {
  position: absolute;
  right: 16px;
  bottom: 10px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 20px;
  color: var(--bow);
  transition: transform 0.12s ease;
}

.project:hover .arrow {
  transform: translateX(4px);
}

/* q&a comic */

.qa {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.qa-row {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    'caption'
    'face'
    'answer';
  gap: 14px;
}

.caption {
  grid-area: caption;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border: var(--line) solid var(--line-color);
  border-radius: 2px;
  background: var(--paper-3);
  box-shadow: var(--hard-shadow-sm);
  width: fit-content;
  max-width: 100%;
}

.caption .q {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border: var(--line) solid var(--line-color);
  border-radius: 999px;
  background: var(--ribbon);
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 13px;
  line-height: 22px;
  text-align: center;
  color: #ffffff;
  transform: rotate(-8deg);
}

.caption p {
  margin: 0;
  font-family: var(--clice-font-display);
  font-weight: 700;
  font-size: 15px;
  color: var(--ink);
}

.qa-row .face {
  grid-area: face;
  position: relative;
  width: 160px;
  height: 160px;
  overflow: hidden;
  background: #ffffff;
}

.qa-row .face img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
}

.num {
  position: absolute;
  left: 0;
  top: 0;
  width: 26px;
  height: 26px;
  border-right: var(--line) solid var(--line-color);
  border-bottom: var(--line) solid var(--line-color);
  border-radius: 0 0 var(--radius) 0;
  background: var(--straw);
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 13px;
  line-height: 26px;
  text-align: center;
  color: #2b3040;
}

.answer {
  grid-area: answer;
  position: relative;
  padding: 18px 22px 20px;
  border: var(--line) solid var(--line-color);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--hard-shadow);
}

.dark .answer {
  background: var(--paper-2);
}

.answer::before,
.answer::after {
  content: '';
  position: absolute;
  top: -14px;
  left: 28px;
  border-style: solid;
  border-width: 0 0 14px 14px;
  border-color: transparent transparent var(--line-color) transparent;
}

.answer::after {
  top: -9px;
  left: 30px;
  border-width: 0 0 10px 10px;
  border-color: transparent transparent var(--panel) transparent;
}

.dark .answer::after {
  border-bottom-color: var(--paper-2);
}

.answer h3 {
  margin: 0 0 8px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 20px;
  color: var(--ink);
}

.answer p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-2);
}

.answer p + p {
  margin-top: 8px;
}

@media (min-width: 768px) {
  .qa-row {
    grid-template-columns: 160px 1fr;
    grid-template-areas:
      '. caption'
      'face answer';
    column-gap: 28px;
    row-gap: 12px;
    align-items: start;
  }

  .qa-row.flip {
    grid-template-columns: 1fr 160px;
    grid-template-areas:
      'caption .'
      'answer face';
  }

  .qa-row.flip .caption {
    justify-self: end;
  }

  .answer::before,
  .answer::after {
    top: 26px;
    left: -14px;
    border-width: 0 14px 12px 0;
    border-color: transparent var(--line-color) transparent transparent;
  }

  .answer::after {
    top: 28px;
    left: -9px;
    border-width: 0 10px 8px 0;
    border-color: transparent var(--panel) transparent transparent;
  }

  .dark .answer::after {
    border-right-color: var(--paper-2);
    border-bottom-color: transparent;
  }

  .qa-row.flip .answer::before,
  .qa-row.flip .answer::after {
    left: auto;
    right: -14px;
    border-width: 12px 0 0 14px;
    border-color: transparent transparent transparent var(--line-color);
  }

  .qa-row.flip .answer::after {
    right: -9px;
    top: 28px;
    border-width: 8px 0 0 10px;
    border-color: transparent transparent transparent var(--panel);
  }

  .dark .qa-row.flip .answer::after {
    border-left-color: var(--paper-2);
    border-right-color: transparent;
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
  .hero-figure img {
    animation: none;
  }
}
</style>
