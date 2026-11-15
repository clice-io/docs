---
title: Technical Blog
description: Curated engineering articles
layout: page
outline: false
---

<script setup lang="ts">
const posts = [
  {
    publishedAt: "2026-11-15",
    author: "ykiko",
    title: "clice v1.0 Released: Welcome to Modern C++",
    summary: "clice reaches 1.0 after four months of alpha testing: what it is, what it does as a language server and beyond, and the story behind it.",
    href: "https://ykiko.me/en/articles/2105384023094834022/"
  },
  {
    publishedAt: "2026-10-07",
    author: "ykiko",
    title: "Starting with import std: Modern C++ Toolchain Best Practices",
    summary: "xclang, the cross-compiling Clang toolchain built for clice: one compiler and libc++ for six targets, import std on every platform, and self-contained binaries.",
    href: "https://ykiko.me/en/articles/2090994886531100694/"
  },
  {
    publishedAt: "2026-08-09",
    author: "ykiko",
    title: "Beyond the Language Server",
    summary: "Progress since the first pre-release, and a new vision for clice as a C++ tool that serves coding agents as well as editors.",
    href: "https://ykiko.me/en/articles/2069934520514749368/"
  },
  {
    publishedAt: "2026-05-05",
    author: "ykiko",
    title: "clice in the Agent Era",
    summary: "Progress on structured concurrency, kotatsu, multi-process architecture, agent-assisted development, and the path toward an agent-native language server.",
    href: "https://ykiko.me/en/articles/2034883949630059124/"
  },
  {
    publishedAt: "2025-12-21",
    author: "ykiko",
    title: "Building an Elegant C++ Cross-Platform Development and Build Workflow",
    summary: "A practical walkthrough for setting up a clean cross-platform C++ build workflow across compilers, platforms, and build systems.",
    href: "https://ykiko.me/en/articles/1985940996270339378/"
  },
  {
    publishedAt: "2025-07-24",
    author: "ykiko",
    title: "Clice, how have you been lately?",
    summary: "A project update on clice.io, roadmap progress, and what changed in the language server implementation.",
    href: "https://ykiko.me/en/articles/1931855290430624907/"
  },
  {
    publishedAt: "2025-02-05",
    author: "ykiko",
    title: "Deep Dive into Clang (Part 1)",
    summary: "Entry points for understanding Clang internals and APIs when building practical C++ tooling.",
    href: "https://ykiko.me/en/articles/21319978959/"
  },
  {
    publishedAt: "2024-12-18",
    author: "ykiko",
    title: "Design and Implementation of a New C++ Language Server",
    summary: "The design rationale, constraints, and architecture choices behind clice.",
    href: "https://ykiko.me/en/articles/13394352064/"
  }
]
</script>

<BlogPostList title="Technical Blog" :posts="posts" />