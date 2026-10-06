# @clice-io/translate

Keeps an English and a Chinese documentation tree aligned segment by
segment, without storing any prose twice. [RULES.md](./RULES.md) states the
contract and the wording rules.

## Usage

```sh
npx @clice-io/translate@1 check     # hard gate: zh isomorphic to en, all pairs attested
npx @clice-io/translate@1 report    # translator worklist: drifted segments with texts
npx @clice-io/translate@1 record    # re-attest hash pairs after deliberate edits
npx @clice-io/translate@1 review [page...] --glossary=FILE  # model review of zh pages
```

| option            | default                  |                                                       |
| ----------------- | ------------------------ | ----------------------------------------------------- |
| `--en=DIR`        | `docs/en`                | English tree                                          |
| `--zh=DIR`        | `docs/zh`                | Chinese tree                                          |
| `--meta=DIR`      | `docs/meta/translations` | hash-pair mappings                                    |
| `--ignore=GLOB`   |                          | leave matching pages out of the contract; repeatable  |
| `--glossary=FILE` |                          | `review`: the repository's terms and page conventions |
| `--jobs=N`        | `4`                      | `review`: parallel model calls                        |
| `--effort=LEVEL`  | `xhigh`                  | `review`: reasoning effort                            |
| `--fast`          |                          | `review`: fast service tier                           |

Paths are relative to the working directory. Ignore globs match page paths
relative to the en and zh roots (`reference/**`); a matching page is
treated as absent from both trees. `review` needs the
[codex CLI](https://github.com/openai/codex) on `PATH`.

In CI, use the `clice-io/docs/check-translations` action, which runs
`check` from the same release.

## Development

```sh
npm ci
npm run check   # type check and lint
npm test
```

The sources run as they are on Node ≥ 22.18; the published package is the
compiled `dist/`. Its version comes from the release tag (`v1.2.3`) at
publish time.
