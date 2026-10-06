# Translation rules (en → zh)

The rules every clice-io repository with a Chinese documentation tree
follows. They are versioned with the tool: a repository pins a release
(`clice-io/docs/check-translations@v1`, `npx @clice-io/translate@1`) and its
own rules name the version they build on. Each repository keeps its own
glossary — product names, fixed feature names, page conventions of its
site — next to its docs and passes it to `review` with `--glossary`.

## The contract

- The **en** and **zh** trees are both real sources, edited directly by a
  person or a model. Every en page has a zh page at the same path, unless
  an ignore glob leaves the page out of the contract altogether.
- A zh page is **segment-isomorphic** to its en page: the same sequence of
  markdown blocks with the same shape.
  - Translatable segments carry the translated text: headings, paragraphs,
    blockquotes, list items, table rows, and the YAML frontmatter.
  - Every other segment is verbatim and byte-identical on both sides: code
    blocks, HTML comments (including generated-region markers), and any
    fenced code or HTML comment nested inside a translatable segment.
  - Shapes that must match: heading depth, ordered vs. bulleted list,
    task-list state, table column count and alignment, a paragraph that is
    entirely bold, and the mapping/sequence skeleton of the frontmatter.
- A table row and a later heading that share their text in en (a status
  row and the section it points to) share it in zh too.
- The **inline literals** of a segment are identical on both sides: code
  spans, link and image targets (in order), issue references such as
  `clangd#1455`, and frontmatter values other than reader-facing copy.
  Copy is the string value of `name`, `text`, `tagline`, `title`,
  `details`, `alt`, `linkText` and `description`; everything else
  (`layout`, `theme`, `icon`, `link`, `src`, ...) is a control value.
- The **meta** tree holds one JSON per page: an ordered list of
  `{kind, en, zh}` hash pairs, one per translatable segment, each attesting
  "these two segments were last reviewed as translations of each other".
  `record` maintains it; never edit it by hand. No text is stored twice —
  the old wording of a drifted segment comes from the git history of the
  markdown page.

## Commands

| command            | what it does                                                 |
| ------------------ | ------------------------------------------------------------ |
| `check`            | hard gate: zh isomorphic to en, every pair attested (CI)     |
| `report`           | translator worklist: each broken pair with both texts        |
| `record`           | re-attest the hash pairs after deliberate edits              |
| `review [page...]` | model review of zh pages, segment by segment (local, not CI) |

`check`, `report` and `record` never write markdown. `review` rewrites the
zh pages it is given — every zh page when given none: each translatable
segment goes to a model next to its en text, code blocks masked out, one
chunk of segments per call (a paired row and heading always in the same
chunk). A reply that breaks a segment's shape, alters an inline literal,
or names a row and its heading differently keeps the current Chinese. A
page fails when a segment ends up as the English copy, unless the mapping
already attests that pair as verbatim (a heading that is a product name):
rerun `review` on it, or `record` a segment that is verbatim on purpose.
The backend is the codex CLI with every tool switched off, so the
contributor-written text it reads reaches neither the host filesystem nor
the network.

## Workflow

1. Edit the en page — or the zh page: the contract is symmetric, polishing
   one side means re-reviewing the other.
2. `report` lists every broken pair with the current en and zh texts.
3. Update the counterpart so both sides correspond again: keep the
   skeleton (block kind, list marker, heading depth, nested code
   byte-identical) and the terminology of the surrounding page; delete zh
   segments whose en segment is gone.
4. Run the repository's formatter first, then `record` — a formatter
   changes segment hashes, so recording before it means recording again.
   `record` blesses whatever is on disk: never run it without having read
   what `report` showed. The diff of the JSON shows which pairs it
   re-attested.
5. Commit the markdown and the mapping together; `check` must be green.

A new or restructured page is drafted by copying the en page over the zh
one and running `review` on it: the pass translates every segment whose
Chinese is still English. Drafts still go through a diff read and
`record`.

## Chinese wording

The zh tree reads as Chinese technical writing, not as glossed English.
The reader is a developer who searches the web in English: translate the
prose, keep the names people search for, and never touch anything a tool
or a compiler reads. `review` embeds these rules in its prompt
(`src/review.ts`); change the two together.

### By position on the page

| Where                                          | Rule                                                                                                                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page and section headings                      | Prose headings are translated. A heading that is an identifier stays verbatim (a config section, a request name, a command line). A mixed heading translates only the prose part and keeps every code span. |
| Table headers and cells                        | Translated. Code spans inside cells stay.                                                                                                                                                                   |
| Task-list items                                | Text translated, `[ ]` / `[x]` state kept.                                                                                                                                                                  |
| Code blocks                                    | Never translated, byte-identical to English. Comments inside code blocks stay English too: they are part of the code.                                                                                       |
| Inline code, paths, config keys, command lines | Never translated; the checker compares them literally.                                                                                                                                                      |
| Issue references, URLs, link targets           | Verbatim.                                                                                                                                                                                                   |
| Compiler and tool output quoted in prose       | Verbatim.                                                                                                                                                                                                   |

### By term

- A concept with an established Chinese term is translated. On its first
  use in a page, give the English in full-width parentheses when the
  English is what one would search for: 结构化绑定（structured bindings）.
- Product and tool names and acronyms stay English, never transliterated.
- Terms Chinese developers use untranslated stay English. When in doubt,
  keep the English term and add a short Chinese gloss rather than invent a
  translation.
- The repository's glossary fixes the concrete lists: which names stay,
  which terms have a fixed translation.

### Style

- Full-width punctuation inside Chinese sentences; a space between CJK and
  Latin text.
- No machine-translation calques: no "这个" as an article, no passive
  chains, no stacked 进行 / 对于 / 通过……的方式; split long relative
  clauses.
- Banned filler: 深入, 强大, 无缝, 赋能, 极大地, 显著地, 值得注意的是,
  总而言之, 综上所述.
- Say what the English says, not word for word.
- One term, one translation within a page; a table row and the heading it
  shares a name with use identical wording.
