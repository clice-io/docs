import type MarkdownIt from "markdown-it";
import yaml from "js-yaml";

/**
 * Feature renderers for the example cards: turn a fixture's source and its
 * recorded snapshot into decorated code HTML and, where the feature has
 * "card-like" results, a list of result panels.
 *
 * Positions in snapshots are 0-based `line:col` in the unstripped fixture;
 * `skipped` is the number of prologue lines the display drops.
 */

export interface Marker {
    name: string;
    offset: number;
    end?: number;
}

export interface Rendered {
    /** Decorated source HTML. */
    code: string;
    /** Result panels, empty for features whose result lives in the code. */
    results: Result[];
    /** `split` shows the results column, `single` only the code, and
     *  `tooltip` pops each marker's result up over its pin. */
    layout: "split" | "single" | "tooltip";
    /** Small legend under the code (token kinds, hint kinds, …). */
    legend: { label: string; cls: string }[];
}

export interface Result {
    name: string;
    meta: string;
    html: string;
}

export interface Insert {
    line: number;
    col: number;
    html: string;
    /** Ties at the same column: lower first. Closers should sort before openers of the same column. */
    order: number;
}

export function escapeHtml(text: string): string {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function decodeHtml(text: string): string {
    return text
        .replaceAll(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
        .replaceAll(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&amp;", "&");
}

/** Parse `line:col` and `line:col-line:col` with the display's line shift. */
function parsePos(text: string, skipped: number): [number, number] {
    const [l, c] = text.split(":");
    return [Number(l) - skipped, Number(c)];
}

function parseRange(text: string, skipped: number): [[number, number], [number, number]] {
    const [a, b] = text.split("-");
    return [parsePos(a ?? "0:0", skipped), parsePos(b ?? a ?? "0:0", skipped)];
}

function offsetToPos(code: string, offset: number): [number, number] {
    let line = 0;
    let lineStart = 0;
    for (let i = 0; i < offset && i < code.length; i += 1) {
        if (code[i] === "\n") {
            line += 1;
            lineStart = i + 1;
        }
    }
    return [line, offset - lineStart];
}

const PIN = (index: number, name: string): string =>
    `<span class="pin" data-name="${escapeHtml(name)}"><i>${index + 1}</i></span>`;

/** Inserts that draw the `§` markers as numbered pins (and ranges as bands). */
export function pinInserts(code: string, markers: Marker[]): Insert[] {
    const out: Insert[] = [];
    markers.forEach((m, index) => {
        const [line, col] = offsetToPos(code, m.offset);
        if (m.end !== undefined && m.end > m.offset) {
            const [endLine, endCol] = offsetToPos(code, m.end);
            const close = endLine === line ? endCol : Number.MAX_SAFE_INTEGER;
            out.push({ line, col, html: `<span class="pin-range">${PIN(index, m.name)}`, order: 5 });
            out.push({ line, col: close, html: `</span>`, order: 0 });
        } else {
            out.push({ line, col, html: PIN(index, m.name), order: 5 });
        }
    });
    return out;
}

/** A single-line range decoration as an open/close insert pair. */
function rangeInserts(
    code: string,
    range: [[number, number], [number, number]],
    cls: string,
    title = "",
): Insert[] {
    const [[l1, c1], [l2, c2]] = range;
    const lines = code.split("\n");
    const out: Insert[] = [];
    for (let l = l1; l <= l2; l += 1) {
        if (l < 0 || l >= lines.length) continue;
        const from = l === l1 ? c1 : 0;
        const to = l === l2 ? c2 : lines[l]!.length;
        if (to <= from) continue;
        const attr = title ? ` title="${escapeHtml(title)}"` : "";
        out.push({ line: l, col: from, html: `<span class="${cls}"${attr}>`, order: 4 });
        out.push({ line: l, col: to, html: `</span>`, order: 1 });
    }
    return out;
}

/**
 * Highlight with the site's shiki highlighter, then apply column inserts
 * and per-line classes. Shiki wraps every line in `<span class="line">`
 * and every token in a span without nested markup, so a token can be
 * split at a column safely.
 */
export function decorate(
    md: MarkdownIt,
    code: string,
    inserts: Insert[],
    lineClasses: Map<number, string[]> = new Map(),
    blockLines = false,
): string {
    const highlight = md.options.highlight;
    const html = highlight ? highlight(code, "cpp", "") : `<pre><code>${escapeHtml(code)}</code></pre>`;
    const byLine = new Map<number, Insert[]>();
    for (const ins of inserts) {
        const list = byLine.get(ins.line) ?? [];
        list.push(ins);
        byLine.set(ins.line, list);
    }
    let lineNo = -1;
    const out = html.replace(/<span class="line">([\s\S]*?)<\/span>(?=\n|<\/code>)/g, (whole, inner: string) => {
        lineNo += 1;
        const here = byLine.get(lineNo);
        const classes = lineClasses.get(lineNo);
        if (!here && !classes) return whole;
        const cls = ["line", ...(classes ?? [])].join(" ");
        return `<span class="${cls}">${here ? applyInserts(inner, here) : inner}</span>`;
    });
    if (!blockLines) return out;
    // Lines as blocks (no newline text between them), so a folded line
    // can be hidden without leaving a blank one behind.
    return out.replace(/<\/span>\n(?=<span class="line)/g, "</span>").replace(/<pre class="shiki/, '<pre class="shiki block-lines');
}

function applyInserts(inner: string, inserts: Insert[]): string {
    const parts: { open: string; text: string; close: string }[] = [];
    const re = /(<span[^>]*>)([\s\S]*?)(<\/span>)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(inner)) !== null) {
        if (m.index > last) parts.push({ open: "", text: inner.slice(last, m.index), close: "" });
        parts.push({ open: m[1]!, text: m[2]!, close: m[3]! });
        last = re.lastIndex;
    }
    if (last < inner.length) parts.push({ open: "", text: inner.slice(last), close: "" });
    const sorted = [...inserts].sort((a, b) => a.col - b.col || a.order - b.order);
    let out = "";
    let col = 0;
    let k = 0;
    for (const part of parts) {
        const text = decodeHtml(part.text);
        let segment = "";
        for (const ch of text) {
            while (k < sorted.length && sorted[k]!.col <= col) {
                segment += sorted[k]!.html;
                k += 1;
            }
            segment += escapeHtml(ch);
            col += 1;
        }
        out += part.open + segment + part.close;
    }
    while (k < sorted.length) {
        out += sorted[k]!.html;
        k += 1;
    }
    return out;
}

function stripWs(file: unknown): string {
    return String(file ?? "").replace(/^\$\{WS\}\//, "");
}

function loadYaml(body: string): unknown {
    try {
        return yaml.load(body);
    } catch {
        return null;
    }
}

function rawResult(body: string): Result[] {
    return [{ name: "", meta: "", html: `<pre class="snap-raw"><code>${escapeHtml(body)}</code></pre>` }];
}

// ---------------------------------------------------------------------------
// hover: `name: { range }` headers followed by markdown bodies

function renderHover(md: MarkdownIt, code: string, markers: Marker[], body: string): Rendered {
    const header = /^([A-Za-z0-9_]+):\s*(\{.*\})?\s*$/;
    const results: Result[] = [];
    let current: Result | null = null;
    let buffer: string[] = [];
    const flush = (): void => {
        if (current) {
            current.html = md.render(buffer.join("\n").trim(), {});
            results.push(current);
        }
        buffer = [];
    };
    const names = new Set(markers.map((m) => m.name));
    for (const line of body.split("\n")) {
        const m = header.exec(line);
        // A result header names a marker (or carries its `{ range }`); a
        // bare `Word:` line inside a card body is prose.
        if (m && !line.startsWith(" ") && (m[2] !== undefined || names.has(m[1]!))) {
            flush();
            current = { name: m[1]!, meta: m[2] ?? "", html: "" };
            continue;
        }
        buffer.push(line);
    }
    flush();
    return {
        code: decorate(md, code, pinInserts(code, markers)),
        results: results.length > 0 ? results : rawResult(body),
        layout: results.length > 0 ? "tooltip" : "split",
        legend: [],
    };
}

// ---------------------------------------------------------------------------
// semantic tokens: the token stream colours the code itself

interface SemanticToken {
    loc: string;
    text: string;
    kind: string;
    modifiers?: string[];
}

function renderSemanticTokens(md: MarkdownIt, code: string, body: string, skipped: number): Rendered {
    const tokens = (loadYaml(body) as SemanticToken[] | null) ?? [];
    const inserts: Insert[] = [];
    const kinds = new Map<string, number>();
    for (const tok of tokens) {
        if (!tok || typeof tok.loc !== "string") continue;
        const [line, col] = parsePos(tok.loc, skipped);
        const mods = (tok.modifiers ?? []).map((m) => `mod-${m}`).join(" ");
        const title = [tok.kind, ...(tok.modifiers ?? [])].join(" · ");
        const len = [...String(tok.text ?? "")].length;
        // Multi-line tokens (block comments) span until the line end; the
        // continuation lines stay plain, which is what the stream records
        // for them too.
        inserts.push({
            line,
            col,
            html: `<span class="tok tok-${tok.kind} ${mods}" title="${escapeHtml(title)}">`,
            order: 4,
        });
        const lineText = code.split("\n")[line] ?? "";
        const firstLineLen = String(tok.text ?? "").split("\n")[0]!.length;
        inserts.push({ line, col: Math.min(col + Math.max(len, 1), Math.max(col + firstLineLen, col + 1), lineText.length), html: `</span>`, order: 1 });
        kinds.set(tok.kind, (kinds.get(tok.kind) ?? 0) + 1);
    }
    const legend = [...kinds.keys()].sort().map((kind) => ({ label: kind, cls: `tok tok-${kind}` }));
    // Shiki supplies the base colouring; clice's classes sit inside its
    // spans and win, so a focused snapshot still reads as code.
    return { code: decorate(md, code, inserts), results: [], layout: "single", legend };
}

// ---------------------------------------------------------------------------
// inlay hints: labels slotted into the code at their position

interface InlayHint {
    pos: string;
    kind: string;
    label: string;
    padding_left?: boolean;
    padding_right?: boolean;
}

function renderInlayHints(md: MarkdownIt, code: string, body: string, skipped: number): Rendered {
    const hints = (loadYaml(body) as InlayHint[] | null) ?? [];
    const inserts: Insert[] = [];
    const kinds = new Set<string>();
    for (const hint of hints) {
        if (!hint || typeof hint.pos !== "string") continue;
        const [line, col] = parsePos(hint.pos, skipped);
        const pad = `${hint.padding_left ? " pad-l" : ""}${hint.padding_right ? " pad-r" : ""}`;
        inserts.push({
            line,
            col,
            html: `<span class="hint hint-${hint.kind}${pad}" title="${escapeHtml(hint.kind)}">${escapeHtml(hint.label)}</span>`,
            order: 6,
        });
        kinds.add(hint.kind);
    }
    const legend = [...kinds].sort().map((kind) => ({ label: kind, cls: `hint hint-${kind}` }));
    return { code: decorate(md, code, inserts), results: [], layout: "single", legend };
}

// ---------------------------------------------------------------------------
// folding ranges: rails in the gutter, one per nesting level

interface Fold {
    range: string;
    kind: string;
}

function renderFolding(md: MarkdownIt, code: string, body: string, skipped: number): Rendered {
    const folds = (loadYaml(body) as Fold[] | null) ?? [];
    const lineClasses = new Map<number, string[]>();
    const inserts: Insert[] = [];
    const kinds = new Set<string>();
    const add = (line: number, cls: string): void => {
        const list = lineClasses.get(line) ?? [];
        list.push(cls);
        lineClasses.set(line, list);
    };
    const total = code.split("\n").length;
    for (const fold of folds) {
        if (!fold || typeof fold.range !== "string") continue;
        const [[l1], [l2]] = parseRange(fold.range, skipped);
        if (l1 < 0 || l1 >= total) continue;
        kinds.add(fold.kind);
        inserts.push({
            line: l1,
            col: 0,
            html: `<span class="fold-mark fold-${fold.kind}" data-start="${l1}" data-end="${Math.min(l2, total - 1)}" title="${escapeHtml(fold.kind)}">▾</span>`,
            order: 3,
        });
        for (let l = l1; l <= Math.min(l2, total - 1); l += 1) {
            add(l, l === l1 ? "fold-start" : l === l2 ? "fold-end" : "fold-in");
        }
    }
    const legend = [...kinds].sort().map((kind) => ({ label: kind, cls: `fold-legend fold-${kind}` }));
    return { code: decorate(md, code, inserts, lineClasses, true), results: [], layout: "single", legend };
}

// ---------------------------------------------------------------------------
// navigation: per marker, relation → locations; same-file targets underlined

type Location = { file?: string; range?: string; name?: string; kind?: string; fromRanges?: string[] };

function renderNavigation(md: MarkdownIt, code: string, markers: Marker[], body: string, skipped: number, self: string): Rendered {
    const data = loadYaml(body) as Record<string, Record<string, Location[] | string> | string> | null;
    if (!data || typeof data !== "object") {
        return { code: decorate(md, code, pinInserts(code, markers)), results: rawResult(body), layout: "split", legend: [] };
    }
    const inserts = pinInserts(code, markers);
    const results: Result[] = [];
    const selfName = self.split("/").pop() ?? self;
    for (const [name, relations] of Object.entries(data)) {
        const index = markers.findIndex((m) => m.name === name);
        const tone = index >= 0 ? `nav-${index % 6}` : "nav-x";
        if (typeof relations !== "object" || relations === null) {
            results.push({ name, meta: "", html: `<p class="snap-none">${escapeHtml(String(relations))}</p>` });
            continue;
        }
        const rows: string[] = [];
        for (const [relation, locations] of Object.entries(relations)) {
            if (!Array.isArray(locations)) {
                rows.push(`<div class="nav-row"><span class="nav-rel">${escapeHtml(relation)}</span><span class="snap-none">${escapeHtml(String(locations))}</span></div>`);
                continue;
            }
            const chips = locations.map((loc) => {
                const file = stripWs(loc.file);
                const range = String(loc.range ?? "");
                const local = file === self || file.endsWith(`/${selfName}`) || file === selfName;
                if (local && range) {
                    inserts.push(...rangeInserts(code, parseRange(range, skipped), `nav-target ${tone}`, `${relation} of ${name}`));
                    for (const from of loc.fromRanges ?? []) {
                        inserts.push(...rangeInserts(code, parseRange(from, skipped), `nav-target ${tone}`, `call site of ${name}`));
                    }
                }
                const parts: string[] = [];
                if (loc.name) parts.push(`<b>${escapeHtml(String(loc.name))}</b>`);
                if (!local) parts.push(`<span class="nav-file">${escapeHtml(file.split("/").pop() ?? file)}</span>`);
                // Other files keep their own prologue, so their ranges are
                // shown as recorded (1-based), not shifted by this file's.
                parts.push(escapeHtml(shiftRange(range, local ? skipped : 0)));
                return `<span class="nav-chip ${tone}" title="${escapeHtml(file)}">${parts.join("")}</span>`;
            });
            rows.push(`<div class="nav-row"><span class="nav-rel">${escapeHtml(relation)}</span>${chips.join("")}</div>`);
        }
        results.push({ name, meta: "", html: rows.join("") });
    }
    return { code: decorate(md, code, inserts), results, layout: "tooltip", legend: [] };
}

function shiftRange(range: string, skipped: number): string {
    return range.replace(/(\d+):(\d+)/g, (_, l: string, c: string) => `${Number(l) - skipped + 1}:${Number(c) + 1}`);
}

// ---------------------------------------------------------------------------
// completion: per marker, a candidate list drawn like a popup

interface CompletionItem {
    label?: string;
    kind?: string;
    description?: string;
    detail?: string;
    edit?: string;
    text?: string;
    snippet?: string;
    [key: string]: unknown;
}

function renderCompletion(md: MarkdownIt, code: string, markers: Marker[], body: string): Rendered {
    const data = loadYaml(body) as Record<string, CompletionItem[] | string> | null;
    if (!data || typeof data !== "object") {
        return { code: decorate(md, code, pinInserts(code, markers)), results: rawResult(body), layout: "split", legend: [] };
    }
    const results: Result[] = [];
    for (const [name, items] of Object.entries(data)) {
        if (!Array.isArray(items)) {
            results.push({ name, meta: "", html: `<p class="snap-none">${escapeHtml(String(items))}</p>` });
            continue;
        }
        const rows = items.map((item) => {
            if (typeof item === "string") return `<li class="cmp-item"><span class="cmp-label">${escapeHtml(item)}</span></li>`;
            const kind = String(item.kind ?? "");
            const extra = String(item.description ?? item.detail ?? "");
            const text = item.snippet ?? item.text;
            const insert = text !== undefined && text !== item.label ? `<span class="cmp-insert">${escapeHtml(String(text))}</span>` : "";
            return `<li class="cmp-item"><span class="cmp-kind cmp-${kind}">${escapeHtml(kind.slice(0, 1))}</span><span class="cmp-label">${escapeHtml(String(item.label ?? ""))}</span><span class="cmp-desc">${escapeHtml(extra)}</span>${insert}</li>`;
        });
        results.push({ name, meta: `${items.length} items`, html: `<ul class="cmp-list">${rows.join("")}</ul>` });
    }
    return { code: decorate(md, code, pinInserts(code, markers)), results, layout: "tooltip", legend: [] };
}

// ---------------------------------------------------------------------------
// signature help: per marker, signatures with the active parameter marked

function renderSignatureHelp(md: MarkdownIt, code: string, markers: Marker[], body: string): Rendered {
    const data = loadYaml(body) as Record<string, string[] | string> | null;
    if (!data || typeof data !== "object") {
        return { code: decorate(md, code, pinInserts(code, markers)), results: rawResult(body), layout: "split", legend: [] };
    }
    const results: Result[] = [];
    for (const [name, sigs] of Object.entries(data)) {
        if (!Array.isArray(sigs)) {
            results.push({ name, meta: "", html: `<p class="snap-none">${escapeHtml(String(sigs))}</p>` });
            continue;
        }
        const rows = sigs.map((sig) => {
            const html = escapeHtml(String(sig)).replaceAll("⟦", '<span class="sig-active">').replaceAll("⟧", "</span>");
            return `<li class="sig-item">${html}</li>`;
        });
        results.push({ name, meta: "", html: `<ul class="sig-list">${rows.join("")}</ul>` });
    }
    return { code: decorate(md, code, pinInserts(code, markers)), results, layout: "tooltip", legend: [] };
}

// ---------------------------------------------------------------------------
// document symbols: an outline tree; depth is the indentation after `-`

function renderDocumentSymbols(md: MarkdownIt, code: string, body: string, skipped: number): Rendered {
    const rows: string[] = [];
    for (const line of body.split("\n")) {
        const m = /^-(\s+)(\{.*\})\s*$/.exec(line);
        if (!m) continue;
        const depth = Math.max(0, Math.floor((m[1]!.length - 1) / 2));
        const item = loadYaml(m[2]!) as { name?: string; kind?: string; detail?: string; range?: string; selection_range?: string } | null;
        if (!item) continue;
        const kind = String(item.kind ?? "");
        const detail = item.detail ? `<span class="sym-detail">${escapeHtml(String(item.detail))}</span>` : "";
        const range = item.selection_range ? `<span class="sym-range">${escapeHtml(shiftRange(String(item.selection_range), skipped).split("-")[0] ?? "")}</span>` : "";
        const [[l1], [l2]] = parseRange(String(item.range ?? "0:0-0:0"), skipped);
        const [[sel]] = parseRange(String(item.selection_range ?? item.range ?? "0:0"), skipped);
        rows.push(
            `<li class="sym-item" style="--depth:${depth}" data-lines="${l1}-${l2}" data-sel="${sel}"><span class="sym-kind sym-${kind}" title="${escapeHtml(kind)}">${escapeHtml(kind.slice(0, 1))}</span><span class="sym-name">${escapeHtml(String(item.name ?? ""))}</span>${detail}${range}</li>`,
        );
    }
    const results: Result[] = rows.length > 0 ? [{ name: "", meta: "", html: `<ul class="sym-list">${rows.join("")}</ul>` }] : rawResult(body);
    return { code: decorate(md, code, []), results, layout: "split", legend: [] };
}

// ---------------------------------------------------------------------------
// document links: ranges become links in the code, targets listed beside

function renderDocumentLinks(md: MarkdownIt, code: string, body: string, skipped: number, self: string): Rendered {
    // A multi-file unit records one `--- <file>` section per file.
    const sections: { file: string; body: string }[] = [];
    let current = { file: "", body: "" };
    for (const line of body.split("\n")) {
        const m = /^--- (.+)$/.exec(line);
        if (m) {
            if (current.body.trim()) sections.push(current);
            current = { file: m[1]!.trim(), body: "" };
            continue;
        }
        current.body += `${line}\n`;
    }
    if (current.body.trim()) sections.push(current);
    const inserts: Insert[] = [];
    const rows: string[] = [];
    let i = 0;
    for (const section of sections) {
        const local = section.file === "" || section.file === self || section.file.endsWith(`/${self}`);
        if (section.file && sections.length > 1) rows.push(`<li class="link-file">${escapeHtml(section.file)}</li>`);
        const links = (loadYaml(section.body) as { range: string; target?: string }[] | null) ?? [];
        for (const link of links) {
            if (!link || typeof link.range !== "string") continue;
            const target = stripWs(link.target);
            if (local) inserts.push(...rangeInserts(code, parseRange(link.range, skipped), "doc-link", target));
            rows.push(`<li class="link-item"><span class="nav-chip nav-${i % 6}">${escapeHtml(shiftRange(link.range, local ? skipped : 0))}</span><span class="link-target">${escapeHtml(target || "—")}</span></li>`);
            i += 1;
        }
    }
    return {
        code: decorate(md, code, inserts),
        results: rows.length > 0 ? [{ name: "", meta: "", html: `<ul class="link-list">${rows.join("")}</ul>` }] : rawResult(body),
        layout: "split",
        legend: [],
    };
}

// ---------------------------------------------------------------------------
// workspace symbols: query → matches

function renderWorkspaceSymbols(md: MarkdownIt, code: string, body: string, skipped: number): Rendered {
    const data = loadYaml(body) as Record<string, { name?: string; kind?: string; file?: string; range?: string }[] | string> | null;
    if (!data || typeof data !== "object") {
        return { code: decorate(md, code, []), results: rawResult(body), layout: "split", legend: [] };
    }
    const results: Result[] = [];
    for (const [query, matches] of Object.entries(data)) {
        const name = `"${query}"`;
        if (!Array.isArray(matches)) {
            results.push({ name, meta: "", html: `<p class="snap-none">${escapeHtml(String(matches))}</p>` });
            continue;
        }
        const rows = matches.map((m) => {
            const kind = String(m.kind ?? "");
            return `<li class="sym-item"><span class="sym-kind sym-${kind}" title="${escapeHtml(kind)}">${escapeHtml(kind.slice(0, 1))}</span><span class="sym-name">${escapeHtml(String(m.name ?? ""))}</span><span class="sym-detail">${escapeHtml(stripWs(m.file))}</span><span class="sym-range">${escapeHtml(shiftRange(String(m.range ?? ""), skipped).split("-")[0] ?? "")}</span></li>`;
        });
        results.push({ name, meta: `${matches.length} matches`, html: `<ul class="sym-list">${rows.join("")}</ul>` });
    }
    return { code: decorate(md, code, []), results, layout: "split", legend: [] };
}

// ---------------------------------------------------------------------------

export function renderFeature(
    md: MarkdownIt,
    feature: string,
    code: string,
    markers: Marker[],
    snapshot: string,
    skipped: number,
    self: string,
): Rendered {
    if (!snapshot.trim()) {
        return { code: decorate(md, code, pinInserts(code, markers)), results: [], layout: "single", legend: [] };
    }
    switch (feature) {
        case "hover":
            return renderHover(md, code, markers, snapshot);
        case "semantic_tokens":
            return renderSemanticTokens(md, code, snapshot, skipped);
        case "inlay_hint":
            return renderInlayHints(md, code, snapshot, skipped);
        case "folding_range":
            return renderFolding(md, code, snapshot, skipped);
        case "navigation":
            return renderNavigation(md, code, markers, snapshot, skipped, self);
        case "code_completion":
            return renderCompletion(md, code, markers, snapshot);
        case "signature_help":
            return renderSignatureHelp(md, code, markers, snapshot);
        case "document_symbol":
            return renderDocumentSymbols(md, code, snapshot, skipped);
        case "document_links":
            return renderDocumentLinks(md, code, snapshot, skipped, self);
        case "workspace_symbol":
            return renderWorkspaceSymbols(md, code, snapshot, skipped);
        default:
            return { code: decorate(md, code, pinInserts(code, markers)), results: rawResult(snapshot), layout: "split", legend: [] };
    }
}
