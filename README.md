# Project Clice Documentation

Documentation site for [Project Clice](https://clice-io.github.io/docs/), built with [VitePress](https://vitepress.dev/).

## Sync docs from other repos

This repo provides a composite action. When docs change in a source repo, it creates a PR here, validates the build, and auto-merges.

Add this workflow to your repo:

```yaml
# .github/workflows/publish-docs.yml
name: publish docs

on:
  push:
    branches: [main]
    paths:
      - "docs/**"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: clice-io/docs@main
        with:
          project: your-project-name
          token: ${{ secrets.PUBLISH_DOCS }}
```

## Doc layout convention

Two-level directory structure. Sidebar is auto-generated: level 1 directories become groups, level 2 `.md` files become items (title extracted from the first `# heading`).

```
docs/
├── en/
│   ├── guide/
│   │   ├── intro.md
│   │   └── quick-start.md
│   ├── design/
│   │   └── architecture.md
│   └── dev/
│       └── build.md
└── zh/                          # same structure
    └── ...
```

## Local development

```bash
npm install
npm run dev
```

To preview with docs from other repos, copy them in:

```bash
cp -rf ../clice/docs/en en/clice
cp -rf ../clice/docs/zh zh/clice
```
