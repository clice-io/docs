# clice.io Documentation

Documentation site for [clice.io](https://docs.clice.io), built with [VitePress](https://vitepress.dev/).

## Sync docs from other repos

This repo is also a composite action that puts a project's docs on the
site. It overlays the project's `docs/en`, `docs/zh`, `docs/public`,
`docs/cards` and `tests/snap` onto a checkout of this repo's `main` and
builds the site there. The `mode` input decides what happens next:

- `check`: only the build. A page that renders on GitHub but breaks
  VitePress (an unclosed `<version>` read as a Vue element, a dead link)
  fails the step, with an annotation naming the page. It needs no token,
  so pull requests from forks can run it.
- `publish` (the default): the same check, then a `sync/<project>` PR here
  with auto-merge enabled. It needs `token`, with write access to this repo,
  and runs only on the source repo's default branch: on a pull request,
  another branch or a tag it fails with "Publish refused".

Check in pull requests, so a breaking page shows up before it merges:

```yaml
# .github/workflows/docs.yml
name: docs

on:
  pull_request:
    paths:
      - "docs/**"
      - "tests/snap/**"

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: clice-io/docs@main
        with:
          project: your-project-name
          mode: check
```

Publish from `main`:

```yaml
# .github/workflows/publish-docs.yml
name: publish docs

on:
  push:
    branches: [main]
    paths:
      - "docs/**"
      - "tests/snap/**"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: clice-io/docs@main
        with:
          project: your-project-name
          token: ${{ secrets.CLICE_DOCS }}
```

Both modes set up Node.js 24 with `actions/setup-node`, which also changes
the `node` every later step of the calling job runs; put the action last,
or set up the node you need again after it.

## Check translations

Repositories with a Chinese tree keep `docs/zh` segment-isomorphic to
`docs/en`, attested by hash pairs in `docs/meta/translations`
([rules](tools/translations/RULES.md)). This composite action fails a PR
whose trees drifted apart:

```yaml
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: clice-io/docs/check-translations@v1
        # with:
        #   en: docs/en
        #   zh: docs/zh
        #   meta: docs/meta/translations
        #   ignore: |
        #     reference/**
```

The action sets up Node.js 24 with `actions/setup-node`, which also changes
the `node` every later step of the calling job runs; put it last, or set
up the node you need again after it.

Locally, the same checker runs as `npx @clice-io/translate@1 check`
(`report`, `record`, `review`); see [tools/translations](tools/translations/README.md).

Releases: `v1.0.0`-style tags are immutable and publish the npm package;
`v1` moves to the newest `v1.x.y`. A new release is tagged only when the
action or the tool changed. After pushing the release tag, move `v1`:

```bash
git tag -f v1 vX.Y.Z && git push -f origin v1
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
