---
title: 技术博客
description: 精选技术文章
layout: page
outline: false
---

<script setup lang="ts">
const posts = [
  {
    publishedAt: "2026-11-15",
    author: "ykiko",
    title: "正式发布 clice v1.0：欢迎来到现代 C++",
    summary: "经过四个月的 alpha 测试，clice 发布 1.0：它是什么、作为语言服务器和语言服务器之外能做什么，以及背后的故事。",
    href: "https://ykiko.me/zh-cn/articles/2105384023094834022/"
  },
  {
    publishedAt: "2026-10-07",
    author: "ykiko",
    title: "从 import std 开始：现代 C++ 工具链最佳实践",
    summary: "介绍为 clice 打造的交叉编译 Clang 工具链 xclang：一套编译器和 libc++ 覆盖六个目标平台，每个平台都能 import std，产物开箱即用。",
    href: "https://ykiko.me/zh-cn/articles/2090994886531100694/"
  },
  {
    publishedAt: "2026-08-09",
    author: "ykiko",
    title: "语言服务器之外",
    summary: "首个预发布版之后的进展，以及 clice 的新方向：不只服务编辑器，也成为 agent 使用的 C++ 工具。",
    href: "https://ykiko.me/zh-cn/articles/2069934520514749368/"
  },
  {
    publishedAt: "2026-05-05",
    author: "ykiko",
    title: "agent 时代的 clice",
    summary: "记录 structured concurrency、kotatsu、多进程架构、agent 编程实践，以及 agent-native 语言服务器方向的思考。",
    href: "https://ykiko.me/zh-cn/articles/2034883949630059124/"
  },
  {
    publishedAt: "2025-12-21",
    author: "ykiko",
    title: "打造优雅的 C++ 跨平台开发与构建 Workflow",
    summary: "一篇面向工程落地的实战文章，讨论跨平台 C++ 开发、构建与协作流程的组织方式。",
    href: "https://ykiko.me/zh-cn/articles/1985940996270339378/"
  },
  {
    publishedAt: "2025-07-24",
    author: "ykiko",
    title: "clice 最近怎么样？",
    summary: "记录 clice.io 上线后的阶段性进展、工程演进与后续方向。",
    href: "https://ykiko.me/zh-cn/articles/1931855290430624907/"
  },
  {
    publishedAt: "2025-02-05",
    author: "ykiko",
    title: "深入探索 clang（上）",
    summary: "从 clice 的工程需求出发，介绍参与 Clang API 开发与调试的关键切入点。",
    href: "https://ykiko.me/zh-cn/articles/21319978959/"
  },
  {
    publishedAt: "2024-12-18",
    author: "ykiko",
    title: "一个新 C++ language server 的设计与实现",
    summary: "介绍 clice 的设计背景、约束条件和核心架构决策。",
    href: "https://ykiko.me/zh-cn/articles/13394352064/"
  }
]
</script>

<BlogPostList title="技术博客" :posts="posts" />
