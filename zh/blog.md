---
title: 技术博客
description: 精选技术文章
layout: page
outline: false
---

<script setup lang="ts">
const posts = [
  {
    publishedAt: "2025-12-21",
    author: "ykiko",
    title: "打造优雅的 C++ 跨平台开发与构建 Workflow",
    summary: "一篇面向工程落地的实战文章，讨论跨平台 C++ 开发、构建与协作流程的组织方式。",
    href: "https://www.ykiko.me/zh-cn/articles/1985940996270339378/"
  },
  {
    publishedAt: "2025-07-24",
    author: "ykiko",
    title: "clice 最近怎么样？",
    summary: "记录 clice.io 上线后的阶段性进展、工程演进与后续方向。",
    href: "https://www.ykiko.me/zh-cn/articles/1931855290430624907/"
  },
  {
    publishedAt: "2025-02-05",
    author: "ykiko",
    title: "深入探索 clang（上）",
    summary: "从 clice 的工程需求出发，介绍参与 Clang API 开发与调试的关键切入点。",
    href: "https://www.ykiko.me/zh-cn/articles/21319978959/"
  },
  {
    publishedAt: "2024-12-18",
    author: "ykiko",
    title: "一个新 C++ language server 的设计与实现",
    summary: "介绍 clice 的设计背景、约束条件和核心架构决策。",
    href: "https://www.ykiko.me/zh-cn/articles/13394352064/"
  }
]
</script>

<BlogPostList title="技术博客" :posts="posts" />