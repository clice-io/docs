<script setup lang="ts">
import { computed } from 'vue'

type Locale = 'en' | 'zh'

type Project = {
  id: string
  title: string
  label: string
  summary: string
  href: string
  external?: boolean
  accent: 'bow' | 'aqua' | 'straw'
}

type Strip = {
  face: 'surprised' | 'skeptical' | 'smiling'
  title: string
  lines: string[]
}

const props = withDefaults(defineProps<{ locale?: Locale }>(), { locale: 'en' })

const content = {
  en: {
    kicker: 'Project Clice',
    bubble: 'Next generation C++ tooling.',
    lead:
      'A language server on the surface, a real-time compilation scheduler underneath. It drives Clang over your whole project and serves editors, linters, indexers and agents from the same engine.',
    primary: { text: 'Start with clice', href: '/clice/guide/what-is-clice' },
    secondary: { text: 'Read the blog', href: '/blog/' },
    projectsTitle: 'Projects',
    projects: [
      {
        id: 'clice',
        title: 'clice',
        label: 'language server · scheduler',
        summary:
          'Compiles, indexes and answers queries for a whole project from one multi-process scheduler. The LSP is its first consumer; lint, index, query and doc follow.',
        href: '/clice/guide/what-is-clice',
        accent: 'bow'
      },
      {
        id: 'catter',
        title: 'catter',
        label: 'build interceptor',
        summary:
          'Hooks every process a build spawns to capture commands, generate compile_commands.json from any build system, profile the build and patch invocations.',
        href: '/catter/guide/what-is-catter',
        accent: 'aqua'
      },
      {
        id: 'kotatsu',
        title: 'kotatsu',
        label: 'C++23 toolkit',
        summary:
          'The infrastructure clice is built on: a coroutine runtime over libuv, compile-time reflection, attribute-driven codecs, typed IPC with LSP bindings, options and CLI.',
        href: 'https://github.com/clice-io/kotatsu',
        external: true,
        accent: 'straw'
      }
    ] satisfies Project[],
    stripTitle: 'Why another one?',
    strip: [
      {
        face: 'surprised',
        title: 'One engine, many tools',
        lines: [
          'Clang exposes a compiler, not the act of compiling a project. clice adds that missing piece: a scheduler that knows every translation unit, its context and its dependencies.',
          'clice lint, index, query, doc and format are all consumers of the same engine, and a cross-TU cache lets them skip work clang-tidy repeats for every header.'
        ]
      },
      {
        face: 'skeptical',
        title: 'The problems clangd never solved',
        lines: [
          'Compilation contexts for files with several commands and headers that are not self-contained. A multi-process design that survives Clang crashes without dropping a query.',
          'A dynamic module graph with shared, on-disk PCH and PCM caches, and a pseudo-instantiator that keeps completion useful inside templates.'
        ]
      },
      {
        face: 'smiling',
        title: 'Ready to try today',
        lines: [
          'Install the VS Code extension and you are done: the binary ships inside it for Windows, Linux and macOS on x64 and arm64. Nightlies roll out every day; Neovim and Zed have first-party clients too.'
        ]
      }
    ] satisfies Strip[]
  },
  zh: {
    kicker: 'Project Clice',
    bubble: '下一代 C++ 工具链。',
    lead:
      '表面上是一个语言服务器，内核是一个实时的编译调度器。它在整个项目上驱动 Clang，用同一个引擎服务编辑器、静态检查、索引和 Agent。',
    primary: { text: '从 clice 开始', href: '/zh/clice/guide/what-is-clice' },
    secondary: { text: '读博客', href: '/zh/blog/' },
    projectsTitle: '项目',
    projects: [
      {
        id: 'clice',
        title: 'clice',
        label: '语言服务器 · 调度器',
        summary:
          '用一个多进程调度器编译、索引整个项目并回答查询。LSP 是它的第一个消费者，lint、index、query 和 doc 紧随其后。',
        href: '/zh/clice/guide/what-is-clice',
        accent: 'bow'
      },
      {
        id: 'catter',
        title: 'catter',
        label: '构建拦截器',
        summary:
          '拦截构建过程中派生的每一个进程，捕获命令、从任意构建系统生成 compile_commands.json、分析构建耗时并改写调用。',
        href: '/zh/catter/guide/what-is-catter',
        accent: 'aqua'
      },
      {
        id: 'kotatsu',
        title: 'kotatsu',
        label: 'C++23 工具箱',
        summary:
          'clice 赖以构建的基础设施：基于 libuv 的协程运行时、编译期反射、属性驱动的编解码、带 LSP 绑定的类型化 IPC、选项解析和 CLI。',
        href: 'https://github.com/clice-io/kotatsu',
        external: true,
        accent: 'straw'
      }
    ] satisfies Project[],
    stripTitle: '为什么还要再写一个？',
    strip: [
      {
        face: 'surprised',
        title: '一个引擎，一串工具',
        lines: [
          'Clang 提供了编译器，却没有提供「编译一个项目」这件事本身的抽象。clice 补上了这一块：一个知道每个翻译单元、它的上下文和依赖的调度器。',
          'clice lint、index、query、doc、format 都是同一个引擎的消费者，跨 TU 缓存让它们跳过 clang-tidy 对每个头文件重复做的工作。'
        ]
      },
      {
        face: 'skeptical',
        title: 'clangd 一直没解决的问题',
        lines: [
          '一个文件对应多条编译命令、头文件非自包含，用编译上下文彻底解决。多进程架构让 Clang 崩溃时查询照常回答。',
          '动态的模块编译图、落盘共享的 PCH / PCM 缓存，以及让模板内部补全依然好用的伪实例化器。'
        ]
      },
      {
        face: 'smiling',
        title: '现在就能用',
        lines: [
          '装上 VS Code 插件就完事：二进制随插件打包，覆盖 Windows / Linux / macOS 的 x64 和 arm64。每天发 nightly，Neovim 和 Zed 也有官方客户端。'
        ]
      }
    ] satisfies Strip[]
  }
}

const page = computed(() => content[props.locale])
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
          <h3>{{ project.title }}</h3>
          <span class="tag">{{ project.label }}</span>
        </div>
        <p>{{ project.summary }}</p>
        <span class="arrow" aria-hidden="true">→</span>
      </a>
    </section>

    <h2 class="section-title">{{ page.stripTitle }}</h2>
    <section class="strip">
      <div v-for="(panel, i) in page.strip" :key="panel.face" class="koma strip-panel">
        <div class="face">
          <img :src="`/mascot/face-${panel.face}.png`" :alt="panel.face" />
          <span class="num">{{ i + 1 }}</span>
        </div>
        <div class="speech">
          <h3>{{ panel.title }}</h3>
          <p v-for="line in panel.lines" :key="line">{{ line }}</p>
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
  letter-spacing: 0.16em;
  text-transform: uppercase;
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

/* strip */

.strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 900px) {
  .strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.strip-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.face {
  position: relative;
  height: 180px;
  border-bottom: var(--line) solid var(--line-color);
  background: #ffffff;
  overflow: hidden;
}

.face img {
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
  width: 30px;
  height: 30px;
  border-right: var(--line) solid var(--line-color);
  border-bottom: var(--line) solid var(--line-color);
  border-radius: 0 0 var(--radius) 0;
  background: var(--straw);
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 14px;
  line-height: 30px;
  text-align: center;
  color: #2b3040;
}

.speech {
  padding: 18px 22px 24px;
}

.speech h3 {
  margin: 0 0 10px;
  font-family: var(--clice-font-display);
  font-weight: 900;
  font-size: 19px;
  color: var(--ink);
}

.speech p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-2);
}

.speech p + p {
  margin-top: 10px;
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
