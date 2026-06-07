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
  accent: 'blue' | 'green' | 'amber' | 'red' | 'violet'
}

const props = withDefaults(defineProps<{ locale?: Locale }>(), {
  locale: 'en'
})

const content = {
  en: {
    projects: [
      {
        id: 'clice',
        title: 'clice',
        label: 'language server',
        summary:
          'Next-generation C++ language server focused on performance and deep code intelligence.',
        href: '/clice/guide/what-is-clice',
        accent: 'blue'
      },
      {
        id: 'kotatsu',
        title: 'kotatsu',
        label: 'infra toolkit',
        summary:
          'Toolkit extracted from clice: async runtime, reflection, codecs, typed IPC/LSP, options, and support utilities.',
        href: 'https://github.com/clice-io/kotatsu',
        external: true,
        accent: 'violet'
      },
      {
        id: 'catter',
        title: 'catter',
        label: 'build interceptor',
        summary:
          'Intercept child processes during builds to capture commands, generate CDBs, profile builds, and patch invocations.',
        href: '/catter',
        accent: 'green'
      },
      {
        id: 'clore',
        title: 'clore',
        label: 'document generator',
        summary:
          'Modern C++ documentation generator for humans and agents, combining LLVM extraction with LLM generation.',
        href: '/clore',
        accent: 'amber'
      },
      {
        id: 'cxx-toolchains',
        title: 'cxx-toolchains',
        label: 'toolchain metadata',
        summary:
          'Machine-readable metadata for compilers, linkers, runtimes, targets, options, ABIs, sysroots, and symbols.',
        href: 'https://github.com/clice-io/cxx-toolchains',
        external: true,
        accent: 'red'
      }
    ] satisfies Project[]
  },
  zh: {
    projects: [
      {
        id: 'clice',
        title: 'clice',
        label: '语言服务器',
        summary:
          '下一代 C++ 语言服务器，重点关注高性能和深度代码智能。',
        href: '/zh/clice/guide/what-is-clice',
        accent: 'blue'
      },
      {
        id: 'kotatsu',
        title: 'kotatsu',
        label: '基础设施库',
        summary:
          '从 clice 生态抽出的工具库，包含异步运行时、反射、编解码、类型化 IPC/LSP、选项解析和通用支持。',
        href: 'https://github.com/clice-io/kotatsu',
        external: true,
        accent: 'violet'
      },
      {
        id: 'catter',
        title: 'catter',
        label: '构建拦截器',
        summary:
          '拦截构建中的子进程，捕获命令、生成 CDB、分析构建过程，并支持脚本化 patch 调用。',
        href: '/zh/catter',
        accent: 'green'
      },
      {
        id: 'clore',
        title: 'clore',
        label: '文档生成器',
        summary:
          '面向人和 agent 的现代 C++ 文档生成器，结合 LLVM 提取和 LLM 生成。',
        href: '/zh/clore',
        accent: 'amber'
      },
      {
        id: 'cxx-toolchains',
        title: 'cxx-toolchains',
        label: '工具链元数据',
        summary:
          '面向机器读取的 C/C++ 工具链元数据，覆盖编译器、链接器、运行时、目标、选项、ABI、sysroot 和符号。',
        href: 'https://github.com/clice-io/cxx-toolchains',
        external: true,
        accent: 'red'
      }
    ] satisfies Project[]
  }
}

const page = computed(() => content[props.locale])
</script>

<template>
  <section class="project-showcase" aria-label="Project links">
    <div class="project-grid">
      <a
        v-for="project in page.projects"
        :key="project.id"
        class="project-card"
        :class="project.accent"
        :href="project.href"
        :target="project.external ? '_blank' : undefined"
        :rel="project.external ? 'noopener noreferrer' : undefined"
      >
        <div class="card-body">
          <div class="card-heading">
            <h3>{{ project.title }}</h3>
            <span class="card-label">{{ project.label }}</span>
          </div>
          <p>{{ project.summary }}</p>
        </div>
      </a>
    </div>
  </section>
</template>

<style scoped>
.project-showcase {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}

.project-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.project-card {
  --accent: var(--vp-c-brand-1);
  position: relative;
  display: block;
  min-height: 86px;
  overflow: hidden;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none;
  padding: 16px 18px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.project-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  height: auto;
  background: var(--accent);
}

.project-card:hover {
  border-color: var(--accent);
  background: var(--vp-c-bg);
  transform: translateY(-2px);
}

.project-card.blue {
  --accent: #3b82f6;
}

.project-card.green {
  --accent: #16a34a;
}

.project-card.amber {
  --accent: #d97706;
}

.project-card.red {
  --accent: #dc2626;
}

.project-card.violet {
  --accent: #7c3aed;
}

.card-body {
  min-width: 0;
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-body h3 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 21px;
  line-height: 27px;
  font-weight: 700;
}

.card-label {
  flex: 0 0 auto;
  max-width: 132px;
  border: 1px solid color-mix(in srgb, var(--accent), transparent 58%);
  border-radius: 999px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  padding: 0 10px;
  text-align: center;
}

.card-body p {
  margin: 6px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 20px;
}

@media (min-width: 720px) {
  .project-card {
    min-height: 88px;
  }
}

@media (max-width: 520px) {
  .card-heading {
    display: block;
  }

  .card-label {
    display: inline-block;
    margin-top: 10px;
  }
}
</style>
