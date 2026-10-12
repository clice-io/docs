import type MarkdownIt from "markdown-it";
import { decorate, escapeHtml, mergeVariants, pinInserts, type Insert, type Rendered, type Result } from "./render";

/**
 * Example cards for the cases of clice's tests: a ```case fence names a
 * case, whose card (written by clice's cases run as
 * `sources/<project>/cases/<id>.json`) carries the sources with their
 * markers' offsets and the output block by block, each place as
 * `{ $place, path, range }`. Nothing here reads snap.toml's text.
 *
 * Answers about places draw into the code: a marker's (highlights,
 * locations, selection ranges, a hover's symbol) while its pin is active,
 * a file's (semantic tokens, inlay hints, folds, links, diagnostics)
 * always. Answers in words (hover markdown, completion lists, signature
 * help, code actions, outlines, command transcripts) are result cards. A
 * case's tests, and the two clients of a test that pins them apart, are
 * its variants: stacked in each result when they draw the same code,
 * tabs over the code when they do not. A test run with options is
 * labelled with them as clice.toml spells them, `key = value`.
 */

export interface CardMarker {
    name: string;
    begin: number;
    end: number;
    range: boolean;
}

export interface CardFile {
    path: string;
    text: string;
    markers: CardMarker[];
}

interface Position {
    line: number;
    character: number;
}

interface CardRange {
    start: Position;
    end: Position;
}

interface CardPlace {
    $place: string;
    path: string;
    range: CardRange;
}

type CardValue = string | number | boolean | CardPlace | CardValue[] | { [key: string]: CardValue };
type Table = { [key: string]: CardValue };

export interface CardBlock {
    label: string;
    marker?: string;
    value: Table;
}

export interface Card {
    id: string;
    topic: string;
    status: string;
    files: CardFile[];
    /** Each test with the options it set, shaped as clice.toml. */
    tests: { name: string; config?: Table; blocks: CardBlock[] }[];
}

type CaseResult = Result & { label: string };

export interface CaseView {
    label: string;
    code: string;
    files: { name: string; html: string; open: boolean }[];
    results: CaseResult[];
    legend: { label: string; cls: string }[];
    notes: string[];
}

export interface CaseRendered extends Rendered {
    markers: string[];
    codeName: string;
    files: CaseView["files"];
    results: CaseResult[];
    notes: string[];
    /** Present when the variants draw different code: one tab each. */
    variants?: CaseView[];
}

const TEXT = {
    en: {
        read: "read",
        write: "write",
        text: "declaration",
        noHighlights: "No highlights",
        noHover: "No hover card",
        noItems: "No completion items",
        noSignatures: "No signature help",
        noActions: "No code actions",
        none: "None",
        noSymbols: "No symbols",
        noCounterpart: "No counterpart",
        noDiagnostics: "No diagnostics",
        noToken: "no token",
        items: (n: number) => (n === 1 ? "1 item" : `${n} items`),
        more: (n: number) => `${n} more`,
        matches: (n: number) => (n === 1 ? "1 match" : `${n} matches`),
        lines: (n: number) => `${n} lines`,
        compiles: "compiles",
        fails: "does not compile",
        preferred: "preferred",
        killed: "killed",
        push: (n: number) => `push ${n}`,
        default: "Default",
        inspect: "clice inspect",
        server: "server",
    },
    zh: {
        read: "读",
        write: "写",
        text: "声明",
        noHighlights: "没有高亮",
        noHover: "没有悬停卡片",
        noItems: "没有补全项",
        noSignatures: "没有签名帮助",
        noActions: "没有代码操作",
        none: "无",
        noSymbols: "没有符号",
        noCounterpart: "没有对应文件",
        noDiagnostics: "没有诊断",
        noToken: "无 token",
        items: (n: number) => `${n} 项`,
        more: (n: number) => `另有 ${n} 项`,
        matches: (n: number) => `${n} 个匹配`,
        lines: (n: number) => `${n} 行`,
        compiles: "可编译",
        fails: "无法编译",
        preferred: "首选",
        killed: "被终止",
        push: (n: number) => `第 ${n} 次推送`,
        default: "默认",
        inspect: "clice inspect",
        server: "服务器",
    },
};

type Texts = (typeof TEXT)["en"];

const SOURCE = /\.(c|cc|cpp|cxx|cppm|ixx|h|hh|hpp|hxx)$/;
const HIDDEN = /(^|\/)compile_commands\.json$|\.jsonl$/;
const CONFIG = /(^|\/)(clice\.toml|\.clang-format|\.clang-tidy|\.clangd)$/;
const WORD = /^[A-Za-z][A-Za-z0-9_]*$/;
const COMMAND = new Set(["stdout", "stderr", "exit", "killed", "files"]);
const CLIENTS = new Set(["inspect", "server"]);

function isPlace(value: CardValue | undefined): value is CardPlace {
    return typeof value === "object" && value !== null && !Array.isArray(value) && "$place" in value;
}

function isTable(value: CardValue | undefined): value is Table {
    return typeof value === "object" && value !== null && !Array.isArray(value) && !("$place" in value);
}

function listOf(value: CardValue | undefined): CardValue[] {
    return Array.isArray(value) ? value : [];
}

function str(value: CardValue | undefined): string {
    return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

/** `value` with its places as their text: what snap.toml reads. */
function plainOf(value: CardValue): unknown {
    if (isPlace(value)) return value.$place;
    if (Array.isArray(value)) return value.map(plainOf);
    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plainOf(item)]));
    }
    return value;
}

function word(text: string): string {
    return WORD.test(text) ? text : "";
}

function hash(text: string): string {
    let h = 5381;
    for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return `m${(h >>> 0).toString(36)}`;
}

function indentOf(line: string): number {
    return line.length - line.trimStart().length;
}

function langOf(file: string): string {
    if (SOURCE.test(file)) return "cpp";
    if (file.endsWith(".toml")) return "toml";
    if (/\.jsonc?$/.test(file)) return "json";
    if (/(^|\/)\.clang-(format|tidy)$|\.ya?ml$/.test(file)) return "yaml";
    return "text";
}

function none(text: string): string {
    return `<p class="snap-none">${escapeHtml(text)}</p>`;
}

// ---------------------------------------------------------------------------
// drawing

/** What a view draws into its files, file by file. */
class Canvas {
    inserts = new Map<string, Insert[]>();
    blockLines = new Set<string>();
    legend = new Map<string, string>();
    notes: string[] = [];
    seen = new Set<string>();

    add(path: string, inserts: Insert[]): void {
        const key = `${path}\u0000${inserts.map((i) => `${i.line}:${i.col}:${i.html}`).join("\u0000")}`;
        if (inserts.length === 0 || this.seen.has(key)) return;
        this.seen.add(key);
        const list = this.inserts.get(path) ?? [];
        list.push(...inserts);
        this.inserts.set(path, list);
    }
}

interface Ctx {
    md: MarkdownIt;
    t: Texts;
    files: Map<string, CardFile>;
    canvas: Canvas;
    /** The file the block asks about: same-file places show no path. */
    query: string;
    /** The marker the block answers at, if any. */
    marker?: CardMarker;
}

/** The keys a gated drawing lights with: the pin's, and its own. */
function keysOf(ctx: Ctx, own: string[] = []): string[] {
    return ctx.marker ? [ctx.marker.name, ...own] : own;
}

function idOf(ctx: Ctx, place: CardPlace, what: string): string {
    const { start, end } = place.range;
    return hash(
        `${ctx.marker?.name ?? ""}|${what}|${place.path}|${start.line}:${start.character}-${end.line}:${end.character}`,
    );
}

/**
 * Wrap `place` in an element on every line it spans, between token spans so
 * it may cover several. At one column a wider element opens first and a
 * narrower one closes first, and of two as wide the one with the lower
 * `depth` is outside: places nest. A place without keys is drawn for good
 * (`on`); with keys, only while a pin or a result names one of them.
 *
 * Inserts at a column go: closers (1–2), hints (3), pins (5), openers (6–7).
 */
function span(ctx: Ctx, place: CardPlace, cls: string, keys: string[], title = "", depth = 2, tag = "span"): void {
    const file = ctx.files.get(place.path);
    if (!file) return;
    const lines = file.text.split("\n");
    const { start, end } = place.range;
    const narrow = 1 / (2 + (end.line - start.line) * 10000 + (end.character - start.character));
    const attrs =
        `class="${cls}${keys.length === 0 && cls.startsWith("mark-range") ? " on" : ""}"` +
        (keys.length ? ` data-for="${escapeHtml(keys.join(" "))}"` : "") +
        (title ? ` title="${escapeHtml(title)}"` : "");
    const out: Insert[] = [];
    if (start.line === end.line && start.character === end.character) {
        out.push({
            line: start.line,
            col: start.character,
            html: `<${tag} ${attrs} data-caret=""></${tag}>`,
            order: 6,
            wrap: true,
        });
    }
    for (let line = start.line; line <= end.line; line += 1) {
        const text = lines[line] ?? "";
        const from = line === start.line ? start.character : indentOf(text);
        const to = line === end.line ? end.character : text.length;
        if (to <= from) continue;
        out.push({ line, col: from, html: `<${tag} ${attrs}>`, order: 6 + narrow + depth * 1e-14, wrap: true });
        out.push({ line, col: to, html: `</${tag}>`, order: 1.5 - narrow - depth * 1e-14, wrap: true });
    }
    ctx.canvas.add(place.path, out);
}

/** A whole-line light for every line `place` spans, lit with `key`. */
function lineMarks(ctx: Ctx, place: CardPlace, key: string): void {
    const out: Insert[] = [];
    for (let line = place.range.start.line; line <= place.range.end.line; line += 1) {
        out.push({ line, col: 0, html: `<span class="line-mark" data-for="${key}"></span>`, order: 0, wrap: true });
    }
    ctx.canvas.add(place.path, out);
}

/** One line of code, highlighted, with `hits` (start, end) set off. */
function codeLine(md: MarkdownIt, text: string, hits: [number, number][], cls = "case-hit", lang = "cpp"): string {
    const inserts: Insert[] = hits.flatMap(([a, b]): Insert[] =>
        a === b
            ? [{ line: 0, col: a, html: `<span class="${cls} case-caret"></span>`, order: 5, wrap: true }]
            : [
                  { line: 0, col: a, html: `<span class="${cls}">`, order: 6, wrap: true },
                  { line: 0, col: b, html: "</span>", order: 1, wrap: true },
              ],
    );
    const html = decorate(md, text, inserts, new Map(), false, lang);
    const begin = html.indexOf("<code>");
    const end = html.lastIndexOf("</code>");
    const inner = begin >= 0 && end > begin ? html.slice(begin + "<code>".length, end) : escapeHtml(text);
    return `<code class="vp-code case-code">${inner}</code>`;
}

/** Text with `⟦…⟧` spans, as its plain text and the spans' offsets. */
function bracketed(text: string): { text: string; hits: [number, number][] } {
    let plain = "";
    const hits: [number, number][] = [];
    let open = -1;
    for (const ch of text) {
        if (ch === "⟦") open = plain.length;
        else if (ch === "⟧" && open >= 0) {
            hits.push([open, plain.length]);
            open = -1;
        } else plain += ch;
    }
    return { text: plain, hits };
}

/** A place as a line of code with the place set off, its file first when
 *  it is not the query's. */
function excerpt(ctx: Ctx, place: CardPlace): string {
    const file = ctx.files.get(place.path);
    const head = place.path !== ctx.query ? `<span class="case-file">${escapeHtml(place.path)}</span>` : "";
    if (file) {
        const { start, end } = place.range;
        const line = file.text.split("\n")[start.line] ?? "";
        const from = Math.min(indentOf(line), start.character);
        const text = line.slice(from).trimEnd();
        const a = Math.min(start.character - from, text.length);
        const b = start.line === end.line ? Math.min(end.character - from, text.length) : text.length;
        const more =
            end.line > start.line
                ? `<span class="case-more">${escapeHtml(ctx.t.lines(end.line - start.line + 1))}</span>`
                : "";
        return head + codeLine(ctx.md, text, [[a, Math.max(a, b)]], "case-hit", langOf(place.path)) + more;
    }
    // Outside the case (a system header): its rendering is all there is.
    let text = place.$place;
    const bar = text.indexOf(" │ ");
    const path = bar >= 0 ? text.slice(0, bar) : place.path;
    if (bar >= 0) text = text.slice(bar + " │ ".length);
    text = text.replace(/ @[+-]?\d+$/, "").replace(/ \((\d+) lines\)$/, "");
    const parsed = bracketed(text);
    return `<span class="case-file">${escapeHtml(path)}</span>` + codeLine(ctx.md, parsed.text, parsed.hits);
}

/** The source text a place covers, its first line. */
function textOf(ctx: Ctx, place: CardPlace): string {
    const file = ctx.files.get(place.path);
    if (!file) return bracketed(place.$place).text;
    const { start, end } = place.range;
    const line = file.text.split("\n")[start.line] ?? "";
    return line.slice(start.character, start.line === end.line ? end.character : undefined);
}

function kindIcon(prefix: "cmp" | "sym", kind: string): string {
    return `<span class="${prefix}-kind ${prefix}-${word(kind)}" title="${escapeHtml(kind)}">${escapeHtml(kind.slice(0, 1))}</span>`;
}

// ---------------------------------------------------------------------------
// answers

/** Where a block's result shows: popped over its pin, below the code
 *  beside the pin's drawing, in a column beside the code, under it, or
 *  nowhere but in the code. */
type Where = "tip" | "inline" | "side" | "below" | "none";

interface Piece {
    html: string;
    where: Where;
    meta?: string;
}

type Answer = (ctx: Ctx, value: CardValue, key: string) => Piece;

function highlights(ctx: Ctx, value: CardValue): Piece {
    const counts = new Map<string, number>();
    for (const item of listOf(value)) {
        if (!isTable(item) || !isPlace(item.at)) continue;
        const kind = word(str(item.kind)) || "text";
        span(ctx, item.at, `mark-range kind-${kind}`, keysOf(ctx));
        counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    for (const kind of ["read", "write", "text"] as const) {
        ctx.canvas.legend.set(ctx.t[kind], `case-kind kind-${kind}`);
    }
    if (counts.size === 0) return { html: none(ctx.t.noHighlights), where: "inline" };
    const names: Record<string, string> = { read: ctx.t.read, write: ctx.t.write, text: ctx.t.text };
    const html = [...counts]
        .map(([kind, n]) => `<span class="case-kind kind-${kind}">${escapeHtml(names[kind] ?? kind)} ×${n}</span>`)
        .join(" ");
    return { html, where: "inline" };
}

function placeRow(ctx: Ctx, place: CardPlace, cls: string): string {
    const id = idOf(ctx, place, cls);
    span(ctx, place, cls, keysOf(ctx, [id]));
    return `<li class="case-place" data-mark="${id}">${excerpt(ctx, place)}</li>`;
}

/** definition, declaration, type_definition, implementation, references. */
function locations(ctx: Ctx, value: CardValue, key: string): Piece {
    const places = listOf(value).filter(isPlace);
    const rows = places.map((place) => placeRow(ctx, place, "mark-range mark-nav"));
    return {
        html:
            `<div class="case-rel"><span class="case-rel-name">${escapeHtml(key)}</span>` +
            (rows.length ? `<ul class="case-places">${rows.join("")}</ul>` : none(ctx.t.none)) +
            `</div>`,
        where: "inline",
    };
}

/** The ranges around the pin, innermost first: the first is selected
 *  with the pin, each one as its step is hovered. */
function selection(ctx: Ctx, value: CardValue): Piece {
    const rows = listOf(value)
        .filter(isPlace)
        .map((place, i) => {
            const id = idOf(ctx, place, `sel${i}`);
            span(ctx, place, "mark-range mark-sel", i === 0 ? keysOf(ctx, [id]) : [id]);
            return `<li class="case-place" data-mark="${id}"><i class="case-step">${i + 1}</i>${excerpt(ctx, place)}</li>`;
        });
    return { html: rows.length ? `<ol class="case-places">${rows.join("")}</ol>` : none(ctx.t.none), where: "inline" };
}

/** incoming_calls, outgoing_calls, supertypes, subtypes. */
function hierarchy(ctx: Ctx, value: CardValue, key: string): Piece {
    const rows = listOf(value)
        .filter(isTable)
        .map((item) => {
            const at = isPlace(item.at) ? item.at : undefined;
            const id = at ? idOf(ctx, at, key) : "";
            if (at) span(ctx, at, "mark-range mark-nav", keysOf(ctx, [id]));
            for (const site of listOf(item.sites).filter(isPlace))
                span(ctx, site, "mark-range mark-word", keysOf(ctx, [id]));
            return (
                `<li class="case-place"${id ? ` data-mark="${id}"` : ""}>` +
                `<span class="case-item">${kindIcon("sym", str(item.kind))}<span class="sym-name">${escapeHtml(str(item.name))}</span></span>` +
                (at ? excerpt(ctx, at) : "") +
                `</li>`
            );
        });
    return {
        html:
            `<div class="case-rel"><span class="case-rel-name">${escapeHtml(key)}</span>` +
            (rows.length ? `<ul class="case-places">${rows.join("")}</ul>` : none(ctx.t.none)) +
            `</div>`,
        where: "inline",
    };
}

function hover(ctx: Ctx, value: CardValue): Piece {
    if (!isTable(value) || typeof value.markdown !== "string") return { html: none(ctx.t.noHover), where: "tip" };
    if (isPlace(value.range)) span(ctx, value.range, "mark-range mark-word", keysOf(ctx));
    return { html: ctx.md.render(value.markdown, {}), where: "tip" };
}

/** A snippet's text with its tab stops drawn as fields. */
function snippetHtml(text: string): string {
    let out = "";
    let last = 0;
    for (const m of text.matchAll(/\$\{(\d+)(?::([^}]*))?\}|\$(\d+)/g)) {
        out += escapeHtml(text.slice(last, m.index));
        const label = m[2] ?? "";
        out += label ? `<span class="cmp-field">${escapeHtml(label)}</span>` : `<span class="cmp-stop"></span>`;
        last = m.index + m[0].length;
    }
    return out + escapeHtml(text.slice(last));
}

function completion(ctx: Ctx, value: CardValue): Piece {
    const items = isTable(value) ? listOf(value.items).filter(isTable) : [];
    const more = isTable(value) && typeof value.more === "number" ? value.more : 0;
    if (items.length === 0) return { html: none(ctx.t.noItems), where: "tip" };
    const rows = items.map((item) => {
        const label = str(item.label);
        const insert = typeof item.insert === "string" ? item.insert : undefined;
        const edit = isPlace(item.replace) ? item.replace : undefined;
        const id = edit ? idOf(ctx, edit, "edit") : "";
        if (edit) span(ctx, edit, "mark-range mark-edit", [id]);
        const shown =
            insert !== undefined && insert !== label
                ? `<span class="cmp-insert">${item.snippet === true ? snippetHtml(insert) : escapeHtml(insert)}</span>`
                : "";
        const filter = typeof item.filter === "string" ? ` title="${escapeHtml(item.filter)}"` : "";
        return (
            `<li class="cmp-item${item.deprecated === true ? " cmp-deprecated" : ""}"${id ? ` data-mark="${id}"` : ""}${filter}>` +
            `${kindIcon("cmp", str(item.kind))}<span class="cmp-label">${escapeHtml(label)}</span>` +
            `<span class="cmp-desc">${escapeHtml(str(item.detail))}</span>${shown}</li>`
        );
    });
    if (more > 0) rows.push(`<li class="cmp-more">${escapeHtml(ctx.t.more(more))}</li>`);
    return { html: `<ul class="cmp-list">${rows.join("")}</ul>`, where: "tip", meta: ctx.t.items(items.length + more) };
}

function signatureHelp(ctx: Ctx, value: CardValue): Piece {
    const signatures = isTable(value) ? listOf(value.signatures).filter((s): s is string => typeof s === "string") : [];
    if (signatures.length === 0) return { html: none(ctx.t.noSignatures), where: "tip" };
    const active = isTable(value) && typeof value.active === "number" ? value.active : -1;
    const rows = signatures.map((signature, i) => {
        const parsed = bracketed(signature);
        return `<li class="sig-item${i === active ? " sig-current" : ""}">${codeLine(ctx.md, parsed.text, parsed.hits, "sig-active")}</li>`;
    });
    return {
        html: `<ul class="sig-list">${rows.join("")}</ul>`,
        where: "tip",
        meta: signatures.length > 1 && active >= 0 ? `${active + 1}/${signatures.length}` : "",
    };
}

/** The token at a pin, as an editor's token inspector shows it. */
function tokenAt(ctx: Ctx, value: CardValue): Piece {
    if (!isTable(value)) return { html: none(ctx.t.noToken), where: "tip" };
    const type = str(value.type);
    const modifiers = listOf(value.modifiers).map(str).filter(Boolean);
    const cls = ["tok", `tok-${word(type)}`, ...modifiers.map((m) => `mod-${word(m)}`)].join(" ");
    const html =
        `<div class="case-token"><code class="${cls}">${escapeHtml(str(value.text))}</code>` +
        (type === "none"
            ? `<span class="snap-none">${escapeHtml(ctx.t.noToken)}</span>`
            : `<span class="case-token-type">${escapeHtml(type)}</span>` +
              modifiers.map((m) => `<span class="case-token-mod">${escapeHtml(m)}</span>`).join("")) +
        `</div>`;
    return { html, where: "tip" };
}

/** A diff with two lines of context, highlighted, the changed lines
 *  marked. */
function diffHtml(md: MarkdownIt, diff: string, file: string): string {
    const classes = new Map<number, string[]>();
    const code = diff.split("\n").map((line, i) => {
        const sign = line.charAt(0);
        if (line === "…" || line === "(no change)") {
            classes.set(i, ["diff-gap"]);
            return line;
        }
        if (sign === "+" || sign === "-") classes.set(i, [sign === "+" ? "diff-add" : "diff-del"]);
        return line.slice(1);
    });
    return `<div class="case-diff">${decorate(md, code.join("\n"), [], classes, true, langOf(file))}</div>`;
}

/** Each file's diff under its name. */
function editsHtml(md: MarkdownIt, files: CardValue | undefined): string {
    if (!isTable(files)) return "";
    return Object.entries(files)
        .map(([file, diff]) => `<div class="case-file-head">${escapeHtml(file)}</div>${diffHtml(md, str(diff), file)}`)
        .join("");
}

function codeActions(ctx: Ctx, value: CardValue): Piece {
    const actions = listOf(value).filter(isTable);
    if (actions.length === 0) return { html: none(ctx.t.noActions), where: "inline" };
    const html = actions.map((action) => {
        const compiles =
            typeof action.compiles === "boolean"
                ? `<span class="ca-check ${action.compiles ? "ok" : "no"}">${action.compiles ? "✓" : "✗"} ${escapeHtml(action.compiles ? ctx.t.compiles : ctx.t.fails)}</span>`
                : "";
        const edits = editsHtml(ctx.md, action.edits);
        const errors = listOf(action.errors).map(str);
        const host = listOf(action.host).map(str);
        return (
            `<div class="ca-item"><div class="ca-head"><span class="ca-title">${escapeHtml(str(action.title))}</span>${compiles}</div>` +
            `<div class="ca-kind">${escapeHtml(str(action.kind))}</div>${edits}` +
            (errors.length ? `<pre class="ca-errors">${escapeHtml(errors.join("\n"))}</pre>` : "") +
            (host.length ? `<pre class="snap-raw">${escapeHtml(host.join("\n"))}</pre>` : "") +
            `</div>`
        );
    });
    return { html: html.join(""), where: "inline" };
}

function semanticTokens(ctx: Ctx, value: CardValue): Piece {
    for (const item of listOf(value)) {
        if (!isTable(item) || !isPlace(item.at)) continue;
        const type = word(str(item.type));
        const modifiers = listOf(item.modifiers).map(str).filter(Boolean);
        const cls = ["tok", `tok-${type}`, ...modifiers.map((m) => `mod-${word(m)}`)].join(" ");
        // Not a span: the theme colours every span of the code by shiki's token.
        span(ctx, item.at, cls, [], [type, ...modifiers].join(" · "), 0, "data");
        ctx.canvas.legend.set(type, `tok tok-${type}`);
    }
    return { html: "", where: "none" };
}

/** Each hinted line reads as the source line with the hints in `⟨⟩`:
 *  the line is found in the file from the pin on, and each hint put back
 *  where its text says. */
function inlayHints(ctx: Ctx, value: CardValue): Piece {
    const file = ctx.files.get(ctx.query);
    if (!file) return { html: "", where: "none" };
    const lines = file.text.split("\n");
    let from = ctx.marker ? file.text.slice(0, ctx.marker.begin).split("\n").length - 1 : 0;
    const out: Insert[] = [];
    for (const item of listOf(value)) {
        if (!isTable(item) || typeof item.line !== "string") continue;
        const pieces = item.line.split(/⟨([^⟩]*)⟩/);
        const texts = pieces.filter((_, i) => i % 2 === 0);
        const labels = pieces.filter((_, i) => i % 2 === 1);
        const plain = texts.join("");
        let at = from;
        while (at < lines.length && lines[at]!.trim() !== plain.trim()) at += 1;
        if (at >= lines.length) continue;
        from = at + 1;
        const base = lines[at]!.indexOf(plain);
        const details = listOf(item.hints).filter(isTable);
        let col = base < 0 ? indentOf(lines[at]!) : base;
        labels.forEach((label, i) => {
            col += texts[i]!.length;
            const detail = details[i];
            const kind = word(str(detail?.kind));
            const padding = listOf(detail?.padding).map(str);
            const links = listOf(detail?.links).filter(isTable);
            const title = [
                kind,
                ...links.map((link) => `${str(link.value)} → ${isPlace(link.target) ? link.target.$place : ""}`),
            ]
                .filter(Boolean)
                .join("\n");
            const cls = `hint${kind ? ` hint-${kind}` : ""}${padding.includes("left") ? " pad-l" : ""}${padding.includes("right") ? " pad-r" : ""}${links.length ? " hint-link" : ""}`;
            out.push({
                line: at,
                col,
                html: `<span class="${cls}"${title ? ` title="${escapeHtml(title)}"` : ""}>${escapeHtml(label)}</span>`,
                order: 3,
                wrap: true,
            });
            if (kind) ctx.canvas.legend.set(kind, `hint hint-${kind}`);
        });
    }
    ctx.canvas.add(file.path, out);
    return { html: "", where: "none" };
}

/** Folds as an editor gutter: a chevron folds the lines below its own and
 *  ends the line with the collapsed text, then what follows the fold on
 *  its last line. */
function foldingRanges(ctx: Ctx, value: CardValue): Piece {
    for (const item of listOf(value)) {
        if (!isTable(item) || !isPlace(item.at)) continue;
        const place = item.at;
        const file = ctx.files.get(place.path);
        if (!file) continue;
        const lines = file.text.split("\n");
        const { start, end } = place.range;
        const kind = word(str(item.kind));
        const id = idOf(ctx, place, "fold");
        const eol = (lines[start.line] ?? "").length;
        const tail = (lines[end.line] ?? "").slice(end.character);
        const collapsed = str(item.collapsed) || "⋯";
        ctx.canvas.blockLines.add(place.path);
        ctx.canvas.add(place.path, [
            {
                line: start.line,
                col: 0,
                html: `<span class="fold-mark fold-${kind}" data-start="${start.line}" data-end="${end.line}" data-fold="${id}" title="${escapeHtml(kind)}">▾</span>`,
                order: 0,
                wrap: true,
            },
            {
                line: start.line,
                col: start.character,
                html: `<span class="fold-open" data-fold="${id}">`,
                order: 3,
                wrap: true,
            },
            { line: start.line, col: eol, html: "</span>", order: 1, wrap: true },
            {
                line: start.line,
                col: eol,
                html: `<span class="fold-shut" data-fold="${id}"><span class="fold-chip">${escapeHtml(collapsed)}</span>${tail ? `<span class="fold-rest">${escapeHtml(tail)}</span>` : ""}</span>`,
                order: 2,
                wrap: true,
            },
        ]);
        if (kind) ctx.canvas.legend.set(kind, `fold-legend fold-${kind}`);
    }
    return { html: "", where: "none" };
}

function documentSymbols(ctx: Ctx, value: CardValue): Piece {
    const rows: string[] = [];
    const walk = (symbols: CardValue[], depth: number): void => {
        for (const symbol of symbols.filter(isTable)) {
            const at = isPlace(symbol.at) ? symbol.at : undefined;
            const id = at ? idOf(ctx, at, "symbol") : "";
            if (at) span(ctx, at, "mark-range mark-nav", [id]);
            if (at && isPlace(symbol.range)) lineMarks(ctx, symbol.range, id);
            const detail = str(symbol.detail);
            rows.push(
                `<li class="sym-item" style="--depth:${depth}"${id ? ` data-mark="${id}"` : ""}>${kindIcon("sym", str(symbol.kind))}` +
                    `<span class="sym-name">${escapeHtml(str(symbol.name))}</span>` +
                    (detail ? `<span class="sym-detail">${escapeHtml(detail)}</span>` : "") +
                    `</li>`,
            );
            walk(listOf(symbol.children), depth + 1);
        }
    };
    walk(listOf(value), 0);
    return { html: rows.length ? `<ul class="sym-list">${rows.join("")}</ul>` : none(ctx.t.noSymbols), where: "side" };
}

function documentLinks(ctx: Ctx, value: CardValue): Piece {
    const rows = listOf(value)
        .filter(isTable)
        .map((link) => {
            const target = str(link.target);
            if (!isPlace(link.at)) return "";
            const id = idOf(ctx, link.at, "link");
            span(ctx, link.at, "doc-link", [id], target, 1);
            return (
                `<li class="link-item" data-mark="${id}"><code class="link-text">${escapeHtml(textOf(ctx, link.at))}</code>` +
                `<span class="link-arrow">→</span><span class="link-target">${escapeHtml(target || "—")}</span></li>`
            );
        });
    return { html: rows.length ? `<ul class="link-list">${rows.join("")}</ul>` : none(ctx.t.none), where: "side" };
}

function workspaceSymbols(ctx: Ctx, value: CardValue): Piece {
    const symbols = listOf(value).filter(isTable);
    const rows = symbols.map((symbol) => {
        const at = isPlace(symbol.at) ? symbol.at : undefined;
        const id = at ? idOf(ctx, at, "symbol") : "";
        if (at) span(ctx, at, "mark-range mark-nav", [id]);
        const container = str(symbol.container);
        return (
            `<li class="sym-item"${id ? ` data-mark="${id}"` : ""}>${kindIcon("sym", str(symbol.kind))}` +
            `<span class="sym-name">${escapeHtml(str(symbol.name))}</span>` +
            (container ? `<span class="sym-detail">${escapeHtml(container)}</span>` : "") +
            (at ? `<span class="sym-file">${escapeHtml(at.path)}</span>` : "") +
            `</li>`
        );
    });
    return {
        html: rows.length ? `<ul class="sym-list">${rows.join("")}</ul>` : none(ctx.t.noSymbols),
        where: "side",
        meta: rows.length ? ctx.t.matches(rows.length) : "",
    };
}

function counterparts(ctx: Ctx, value: CardValue): Piece {
    const preferred = isTable(value) ? str(value.preferred) : "";
    const candidates = isTable(value) ? listOf(value.candidates).filter(isTable) : [];
    if (candidates.length === 0) return { html: none(ctx.t.noCounterpart), where: "side" };
    const rows = candidates.map((candidate) => {
        const path = str(candidate.path);
        return (
            `<li class="cp-item"><span class="cp-head"><span class="cp-arrow">→</span><code class="cp-path">${escapeHtml(path)}</code>` +
            (path === preferred ? `<span class="cp-preferred">★ ${escapeHtml(ctx.t.preferred)}</span>` : "") +
            `</span><ul class="cp-reasons">${listOf(candidate.reasons)
                .map((reason) => `<li>${escapeHtml(str(reason))}</li>`)
                .join("")}</ul></li>`
        );
    });
    return { html: `<ul class="cp-list">${rows.join("")}</ul>`, where: "side" };
}

function diagnosticRows(ctx: Ctx, list: CardValue[]): string {
    return list
        .filter(isTable)
        .map((diagnostic) => {
            const severity = word(str(diagnostic.severity)) || "error";
            const message = str(diagnostic.message);
            const at = isPlace(diagnostic.at) ? diagnostic.at : undefined;
            const id = at ? idOf(ctx, at, `diag ${message}`) : "";
            if (at) span(ctx, at, `diag diag-${severity}`, [id], message, 1);
            const origin = [str(diagnostic.source), str(diagnostic.code)].filter(Boolean).join(" ");
            return (
                `<li class="diag-item"${id ? ` data-mark="${id}"` : ""}><span class="diag-icon diag-${severity}" title="${severity}"></span>` +
                `<span class="diag-message">${escapeHtml(message)}</span>` +
                (origin ? `<span class="diag-origin">${escapeHtml(origin)}</span>` : "") +
                `</li>`
            );
        })
        .join("");
}

function diagnostics(ctx: Ctx, value: CardValue): Piece {
    const rows = diagnosticRows(ctx, listOf(value));
    return { html: rows ? `<ul class="diag-list">${rows}</ul>` : none(ctx.t.noDiagnostics), where: "side" };
}

function pushes(ctx: Ctx, value: CardValue): Piece {
    const groups = listOf(value).map((push, i) => {
        const rows = diagnosticRows(ctx, listOf(push));
        return `<div class="diag-push"><span class="case-rel-name">${escapeHtml(ctx.t.push(i + 1))}</span>${rows ? `<ul class="diag-list">${rows}</ul>` : none(ctx.t.noDiagnostics)}</div>`;
    });
    return { html: groups.join("") || none(ctx.t.noDiagnostics), where: "side" };
}

function contexts(ctx: Ctx, value: CardValue): Piece {
    const rows = listOf(value)
        .filter(isTable)
        .map(
            (context) =>
                `<li class="cp-item"><span class="cp-head"><b>${escapeHtml(str(context.label))}</b></span>` +
                `<span class="sym-detail">${escapeHtml(str(context.description))}</span>` +
                (str(context.host) ? `<code class="cp-path">${escapeHtml(str(context.host))}</code>` : "") +
                `</li>`,
        );
    return { html: rows.length ? `<ul class="cp-list">${rows.join("")}</ul>` : none(ctx.t.none), where: "side" };
}

/** Text, lines or a number a test shows. */
function text(ctx: Ctx, value: CardValue): Piece {
    const body = Array.isArray(value)
        ? value.map((line) => str(line)).join("\n")
        : str(value) || JSON.stringify(plainOf(value));
    return { html: `<pre class="snap-raw"><code>${escapeHtml(body)}</code></pre>`, where: ctx.marker ? "tip" : "side" };
}

function raw(ctx: Ctx, value: CardValue, key: string): Piece {
    return {
        html: `<div class="case-rel"><span class="case-rel-name">${escapeHtml(key)}</span><pre class="snap-raw"><code>${escapeHtml(JSON.stringify(plainOf(value), null, 2))}</code></pre></div>`,
        where: ctx.marker ? "tip" : "side",
    };
}

const ANSWERS: Record<string, Answer> = {
    highlights,
    definition: locations,
    declaration: locations,
    type_definition: locations,
    implementation: locations,
    references: locations,
    selection_ranges: selection,
    incoming_calls: hierarchy,
    outgoing_calls: hierarchy,
    supertypes: hierarchy,
    subtypes: hierarchy,
    hover,
    completion,
    signature_help: signatureHelp,
    semantic_token: tokenAt,
    semantic_tokens: semanticTokens,
    inlay_hints: inlayHints,
    folding_ranges: foldingRanges,
    document_symbols: documentSymbols,
    document_links: documentLinks,
    workspace_symbols: workspaceSymbols,
    counterparts,
    diagnostics,
    errors: diagnostics,
    pushes,
    contexts,
    code_actions: codeActions,
    value: text,
};

/** A command's run as a terminal shows it, and the files it wrote. */
function transcript(ctx: Ctx, label: string, value: Table): string {
    const command = label.replace(/^\$\s*/, "");
    const exit = typeof value.exit === "number" ? value.exit : undefined;
    const status =
        exit !== undefined
            ? `<span class="term-exit ${exit === 0 ? "ok" : "no"}">exit ${exit}</span>`
            : typeof value.killed === "string"
              ? `<span class="term-exit no">${escapeHtml(ctx.t.killed)} ${escapeHtml(value.killed)}</span>`
              : "";
    const stdout = str(value.stdout);
    const json = /^[[{]/.test(stdout.trim());
    const out = stdout
        ? json
            ? `<div class="term-json">${decorate(ctx.md, stdout, [], new Map(), false, "json")}</div>`
            : `<pre class="term-out">${escapeHtml(stdout)}</pre>`
        : "";
    const stderr = listOf(value.stderr).map(str);
    const files = editsHtml(ctx.md, value.files);
    return (
        `<div class="term"><div class="term-cmd"><span class="term-prompt">$</span><code>${escapeHtml(command)}</code>${status}</div>` +
        out +
        (stderr.length ? `<pre class="term-err">${escapeHtml(stderr.join("\n"))}</pre>` : "") +
        `</div>${files}`
    );
}

const RANK: Record<Where, number> = { none: 0, tip: 1, inline: 2, below: 3, side: 4 };

// ---------------------------------------------------------------------------
// views

interface Block {
    label: string;
    marker?: string;
    value: Table;
}

interface View {
    key: string;
    label: string;
    blocks: Block[];
}

/** A block of an answers test whose clients answer apart on purpose: it
 *  holds the client's blocks rather than an answer. */
function isClient(block: CardBlock): boolean {
    return (
        !block.marker &&
        CLIENTS.has(block.label) &&
        Object.entries(block.value).every(
            ([key, item]) => key === "wrong" || (isTable(item) && !(key in ANSWERS) && !COMMAND.has(key)),
        )
    );
}

const BARE_KEY = /^[A-Za-z0-9_-]+$/;

function tomlOf(value: CardValue): string {
    if (typeof value === "string") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(tomlOf).join(", ")}]`;
    if (isTable(value)) return `{ ${pairsOf(value).join(", ")} }`;
    return String(value);
}

/** A table as clice.toml's dotted keys: `inlay_hints.block_end = true`. */
function pairsOf(table: Table, prefix = ""): string[] {
    return Object.entries(table).flatMap(([name, value]) => {
        const key = prefix + (BARE_KEY.test(name) ? name : JSON.stringify(name));
        return isTable(value) ? pairsOf(value, `${key}.`) : [`${key} = ${tomlOf(value)}`];
    });
}

function viewsOf(card: Card, t: Texts): View[] {
    const markers = new Set(card.files.flatMap((file) => file.markers.map((m) => m.name)));
    const testLabel = (test: Card["tests"][number]): string =>
        card.tests.length < 2
            ? ""
            : test.config
              ? pairsOf(test.config).join(", ")
              : test.name === "default"
                ? t.default
                : test.name;
    return card.tests.flatMap((test) => {
        const shared = test.blocks.filter((block) => !isClient(block));
        const clients = test.blocks.filter(isClient);
        const expand = (block: CardBlock): Block[] => {
            const { wrong, ...inner } = block.value;
            return Object.entries(inner).map(([label, value]) => ({
                label,
                ...(markers.has(label) ? { marker: label } : {}),
                value:
                    wrong !== undefined && isTable(value) && value.wrong === undefined
                        ? { wrong, ...value }
                        : (value as Table),
            }));
        };
        if (clients.length === 0) return [{ key: test.name, label: testLabel(test), blocks: shared }];
        return clients.map((client) => ({
            key: `${test.name}/${client.label}`,
            label: [testLabel(test), client.label === "server" ? t.server : t.inspect].filter(Boolean).join(" · "),
            blocks: [...shared, ...expand(client)],
        }));
    });
}

/** The file the card opens with: the case's entry, else its first marked
 *  source; a command's case may have none. */
function entryOf(card: Card, command: boolean): CardFile | undefined {
    return (
        card.files.find((file) => /^main\.[a-z]+$/.test(file.path)) ??
        card.files.find((file) => file.markers.length > 0) ??
        (command ? undefined : card.files.find((file) => SOURCE.test(file.path)))
    );
}

interface Drawn {
    canvas: Canvas;
    results: CaseResult[];
    rank: number;
    pinned: boolean;
    wrong: boolean;
}

function drawView(md: MarkdownIt, card: Card, view: View, t: Texts, entry: CardFile | undefined): Drawn {
    const files = new Map(card.files.map((file) => [file.path, file]));
    const markers = new Map(card.files.flatMap((file) => file.markers.map((m) => [m.name, { file, m }] as const)));
    const canvas = new Canvas();
    const results: CaseResult[] = [];
    let rank = 0;
    let pinned = false;
    let wrong = false;
    // A heading naming the file every result is about says nothing.
    const unmarked = view.blocks.filter((block) => !block.marker).map((block) => block.label);
    const silent = unmarked.length > 0 && unmarked.every((label) => label === entry?.path);
    for (const block of view.blocks) {
        const at = block.marker ? markers.get(block.marker) : undefined;
        const ctx: Ctx = {
            md,
            t,
            files,
            canvas,
            query: at?.file.path ?? (files.has(block.label) ? block.label : (entry?.path ?? "")),
            ...(at ? { marker: at.m } : {}),
        };
        const { wrong: flag, ...answer } = block.value;
        const command = Object.keys(answer).some((key) => COMMAND.has(key));
        const pieces: Piece[] = command
            ? [{ html: transcript(ctx, block.label, answer), where: "below" }]
            : Object.entries(answer).map(([key, value]) => (ANSWERS[key] ?? raw)(ctx, value, key));
        let html = pieces.map((piece) => piece.html).join("");
        let where = pieces.reduce<Where>(
            (best, piece) => (RANK[piece.where] > RANK[best] ? piece.where : best),
            "none",
        );
        if (!at && (where === "tip" || where === "inline")) where = "side";
        if (typeof flag === "string") {
            wrong = true;
            const note = `<p class="case-wrong">✗ ${escapeHtml(flag)}</p>`;
            if (html) html = note + html;
            else canvas.notes.push(note);
        }
        if (!html) continue;
        rank = Math.max(rank, RANK[where]);
        pinned ||= at !== undefined;
        const label =
            at || command || silent ? "" : answer.workspace_symbols !== undefined ? `"${block.label}"` : block.label;
        results.push({
            name: block.marker ?? block.label,
            label,
            meta: pieces
                .map((piece) => piece.meta ?? "")
                .filter(Boolean)
                .join(" · "),
            html,
        });
    }
    return { canvas, results, rank, pinned, wrong };
}

function codeOf(md: MarkdownIt, shown: CardFile[], drawn: Drawn): Map<string, string> {
    const html = new Map<string, string>();
    let first = 0;
    for (const file of shown) {
        const inserts = [...(drawn.canvas.inserts.get(file.path) ?? [])];
        if (drawn.pinned) {
            inserts.push(
                ...pinInserts(
                    file.text,
                    file.markers.map((m) =>
                        m.range ? { name: m.name, offset: m.begin, end: m.end } : { name: m.name, offset: m.begin },
                    ),
                    first,
                    true,
                ),
            );
        }
        first += file.markers.length;
        const text = file.text.replace(/\n$/, "");
        html.set(
            file.path,
            decorate(md, text, inserts, new Map(), drawn.canvas.blockLines.has(file.path), langOf(file.path)),
        );
    }
    return html;
}

const LAYOUT: Rendered["layout"][] = ["single", "tooltip", "inline", "stack", "split"];

export function renderCard(md: MarkdownIt, card: Card, lang: string): CaseRendered {
    const t = lang === "zh" ? TEXT.zh : TEXT.en;
    const command = card.tests.every((test) =>
        test.blocks.every((block) => Object.keys(block.value).some((key) => COMMAND.has(key))),
    );
    const entry = entryOf(card, command);
    const rest = card.files.filter((file) => file !== entry && !HIDDEN.test(file.path));
    const shown = entry ? [entry, ...rest] : rest;
    const views = viewsOf(card, t);
    const drawn = views.map((view) => drawView(md, card, view, t, entry));
    const named = new Set(views.flatMap((view) => view.blocks.map((block) => block.label)));
    const markers = shown.flatMap((file) => file.markers.map((m) => m.name));
    const rendered = drawn.map((d, i): CaseView => {
        const html = codeOf(md, shown, d);
        return {
            label: escapeHtml(views[i]!.label) + (d.wrong ? ' <span class="case-wrong-mark">✗</span>' : ""),
            code: entry ? (html.get(entry.path) ?? "") : "",
            files: shown
                .filter((file) => file !== entry)
                .map((file) => ({
                    name: file.path,
                    html: html.get(file.path) ?? "",
                    open:
                        file.markers.length > 0 ||
                        CONFIG.test(file.path) ||
                        named.has(file.path) ||
                        drawn.some((x) => x.canvas.inserts.has(file.path)),
                })),
            results: d.results,
            legend: [...d.canvas.legend].map(([label, cls]) => ({ label, cls })),
            notes: d.canvas.notes,
        };
    });
    const rank = Math.max(...drawn.map((d) => d.rank));
    const layout = LAYOUT[rank]!;
    const first = rendered[0]!;
    const base = {
        markers,
        codeName: entry && shown.length > 1 ? entry.path : "",
        layout,
    };
    if (rendered.length === 1) return { ...base, ...first };
    const same = rendered.every(
        (view) => view.code === first.code && JSON.stringify(view.files) === JSON.stringify(first.files),
    );
    if (!same) {
        return { ...base, ...first, variants: rendered };
    }
    // The variants draw the same code: each result holds every variant's.
    const merged = mergeVariants(
        views.map((view) => ({ key: view.key })),
        rendered.map((view) => ({ code: view.code, results: view.results, layout, legend: view.legend })),
        Object.fromEntries(views.map((view, i) => [view.key, { label: rendered[i]!.label }])),
    );
    const labels = new Map(rendered.flatMap((view) => view.results.map((r) => [r.name, r.label] as const)));
    return {
        ...base,
        ...first,
        results: merged.results.map((r) => ({ ...r, label: labels.get(r.name) ?? "" })),
        notes: [...new Set(rendered.flatMap((view) => view.notes))],
    };
}
