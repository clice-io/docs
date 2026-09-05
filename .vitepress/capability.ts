import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it/index.js";
import yaml from "js-yaml";

/**
 * Capability cards for the generated feature pages.
 *
 * clice's docs generator emits each capability as
 *
 *     <!-- BEGIN CAPABILITY: supported clangd#710 -->
 *     **Name**
 *     details / description paragraphs
 *     ```snap-hover
 *     feature: hover
 *     code: |   (example with § markers)
 *     snapshot: | (recorded result)
 *     ```
 *     <!-- END CAPABILITY -->
 *
 * The comments and the fence are byte-identical across the en and zh
 * trees; the paragraphs are translated. Here the comments become the card
 * frame with a status sticker and issue links, the first paragraph becomes
 * the card title, and the fence becomes a <SnapExample> component fed
 * with the parsed, pre-rendered example.
 */

const BEGIN = /^<!-- BEGIN CAPABILITY: ([^>]*?) -->\s*$/;
const END = /^<!-- END CAPABILITY -->\s*$/;

const TRACKERS: Record<string, string> = {
    clangd: "https://github.com/clangd/clangd/issues/",
    vscode: "https://github.com/microsoft/vscode/issues/",
    llvm: "https://github.com/llvm/llvm-project/issues/",
};

const LABELS: Record<string, Record<string, string>> = {
    en: { supported: "Supported", partial: "Partial", unsupported: "Unsupported" },
    zh: { supported: "支持", partial: "部分支持", unsupported: "不支持" },
};

const TONE: Record<string, string> = { supported: "ok", partial: "warn", unsupported: "no" };

function issueLink(ref: string): string {
    const hash = ref.indexOf("#");
    const tracker = ref.slice(0, hash);
    const base = TRACKERS[tracker];
    if (!base) {
        return `<span>${ref}</span>`;
    }
    return `<a href="${base}${ref.slice(hash + 1)}" target="_blank" rel="noopener noreferrer">${ref}</a>`;
}

interface Marker {
    name: string;
    offset: number;
    end?: number;
}

/** Strip `§`, `§(name)`, `§⟦…⟧` and `§(name)⟦…⟧` annotations, keeping offsets. */
function parseMarkers(text: string): { code: string; markers: Marker[] } {
    let code = "";
    const markers: Marker[] = [];
    const stack: { name: string; start: number }[] = [];
    let nameless = 0;
    let i = 0;
    while (i < text.length) {
        const ch = text[i];
        if (ch === "§") {
            i += 1;
            let name = "";
            if (text[i] === "(") {
                const close = text.indexOf(")", i);
                name = text.slice(i + 1, close);
                i = close + 1;
            }
            if (text[i] === "⟦") {
                stack.push({ name, start: code.length });
                i += 1;
            } else {
                if (!name) {
                    name = `nameless_${nameless}`;
                    nameless += 1;
                }
                markers.push({ name, offset: code.length });
            }
            continue;
        }
        if (ch === "⟧" && stack.length > 0) {
            const open = stack.pop()!;
            const name = open.name || `nameless_${nameless++}`;
            markers.push({ name, offset: open.start, end: code.length });
            i += 1;
            continue;
        }
        code += ch;
        i += 1;
    }
    return { code, markers };
}

function escapeHtml(text: string): string {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

/**
 * Highlight the code with the site's shiki highlighter, then pin the
 * markers into the highlighted HTML by character offset. Shiki wraps
 * every line in `<span class="line">` and every token in a span with no
 * nested markup, so a token can be split at a column safely.
 */
function highlightWithPins(md: MarkdownIt, code: string, markers: Marker[]): string {
    const highlight = md.options.highlight;
    const html = highlight ? highlight(code, "cpp", "") : `<pre><code>${escapeHtml(code)}</code></pre>`;
    const lines = code.split("\n");
    // Offsets → (line, column) in characters.
    const starts: number[] = [];
    let acc = 0;
    for (const line of lines) {
        starts.push(acc);
        acc += line.length + 1;
    }
    const pins = markers
        .map((m, index) => ({ ...m, index }))
        .sort((a, b) => a.offset - b.offset);
    const lineOf = (offset: number): [number, number] => {
        let lo = 0;
        for (let l = 0; l < starts.length; l += 1) {
            if (starts[l]! <= offset) lo = l;
        }
        return [lo, offset - starts[lo]!];
    };
    const byLine = new Map<number, { col: number; index: number; name: string; endCol?: number }[]>();
    for (const pin of pins) {
        const [line, col] = lineOf(pin.offset);
        const list = byLine.get(line) ?? [];
        const entry: { col: number; index: number; name: string; endCol?: number } = {
            col,
            index: pin.index,
            name: pin.name,
        };
        if (pin.end !== undefined) {
            const [endLine, endCol] = lineOf(pin.end);
            entry.endCol = endLine === line ? endCol : lines[line]!.length;
        }
        list.push(entry);
        byLine.set(line, list);
    }
    let lineNo = -1;
    return html.replace(/<span class="line">([\s\S]*?)<\/span>(?=\n|<\/code>)/g, (whole, inner: string) => {
        lineNo += 1;
        const pinsHere = byLine.get(lineNo);
        if (!pinsHere) return whole;
        return `<span class="line">${pinLine(inner, pinsHere)}</span>`;
    });
}

function pinLine(
    inner: string,
    pins: { col: number; index: number; name: string; endCol?: number }[],
): string {
    // Rebuild the line as a sequence of (openTag, text, closeTag) tokens.
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
    const decode = (t: string): string =>
        t.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&amp;", "&");
    // Insert markup at character columns.
    const inserts: { col: number; html: string; order: number }[] = [];
    for (const pin of pins) {
        const badge = `<span class="pin" data-name="${pin.name}"><i>${pin.index + 1}</i></span>`;
        if (pin.endCol !== undefined && pin.endCol > pin.col) {
            inserts.push({ col: pin.col, html: `<span class="pin-range">${badge}`, order: 0 });
            inserts.push({ col: pin.endCol, html: `</span>`, order: 1 });
        } else {
            inserts.push({ col: pin.col, html: badge, order: 0 });
        }
    }
    inserts.sort((a, b) => a.col - b.col || a.order - b.order);
    let out = "";
    let col = 0;
    let k = 0;
    for (const part of parts) {
        const text = decode(part.text);
        let segment = "";
        for (const ch of text) {
            while (k < inserts.length && inserts[k]!.col === col) {
                segment += inserts[k]!.html;
                k += 1;
            }
            segment += escapeHtml(ch);
            col += 1;
        }
        out += part.open + segment + part.close;
    }
    while (k < inserts.length) {
        out += inserts[k]!.html;
        k += 1;
    }
    return out;
}

interface SnapData {
    feature?: string;
    code?: string;
    snapshot?: string;
    [key: string]: unknown;
}

/** Render one `snap-<feature>` fence into a SnapExample component. */
function renderSnap(md: MarkdownIt, info: string, content: string): string {
    const feature = info.slice("snap-".length).trim();
    const data = (yaml.load(content) as SnapData) ?? {};
    const { code, markers } = parseMarkers(data.code ?? "");
    const files: { name: string; html: string }[] = [];
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith("file ") && typeof value === "string") {
            const parsed = parseMarkers(value);
            files.push({ name: key.slice(5), html: highlightWithPins(md, parsed.code, parsed.markers) });
        }
    }
    const payload = {
        feature,
        code: highlightWithPins(md, code, markers),
        markers: markers.map((m) => m.name),
        files,
        results: parseSnapshot(md, feature, data.snapshot ?? ""),
        raw: data.snapshot ?? "",
    };
    const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    return `<SnapExample data="${encoded}" />\n`;
}

interface Result {
    name: string;
    meta: string;
    html: string;
}

/**
 * Split a snapshot body into per-marker results. Hover-style snapshots
 * are `name: { … }` header lines followed by a markdown body; list-style
 * snapshots (inlay hints, tokens) are one YAML flow entry per line and
 * render as a single block.
 */
function parseSnapshot(md: MarkdownIt, feature: string, body: string): Result[] {
    if (!body.trim()) return [];
    const lines = body.split("\n");
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
    for (const line of lines) {
        const m = header.exec(line);
        if (m && !line.startsWith(" ")) {
            flush();
            current = { name: m[1]!, meta: m[2] ?? "", html: "" };
            continue;
        }
        buffer.push(line);
    }
    flush();
    if (results.length === 0) {
        return [{ name: "", meta: "", html: `<pre class="snap-raw"><code>${escapeHtml(body)}</code></pre>` }];
    }
    return results;
}

export function capabilityCards(md: MarkdownIt): void {
    const fence = md.renderer.rules.fence!;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]!;
        if (token.info.trim().startsWith("snap-")) {
            return renderSnap(md, token.info.trim(), token.content);
        }
        return fence(tokens, idx, options, env, self);
    };

    md.core.ruler.push("clice_capability", (state) => {
        const lang = String((state.env as { relativePath?: string }).relativePath ?? "").startsWith("zh/")
            ? "zh"
            : "en";
        const tokens = state.tokens;
        for (let i = 0; i < tokens.length; i += 1) {
            const token = tokens[i]!;
            if (token.type !== "html_block") continue;
            const begin = BEGIN.exec(token.content.trim());
            if (begin) {
                const [status = "", ...issues] = begin[1]!.trim().split(/\s+/).filter(Boolean);
                const tone = TONE[status] ?? "note";
                const label = LABELS[lang]?.[status] ?? status;
                const links = issues.map(issueLink).join(" ");
                token.content =
                    `<div class="capability ${tone}"><div class="capability-meta">` +
                    `<span class="status-badge ${tone}">${label}</span>` +
                    (links ? `<span class="capability-issues">${links}</span>` : "") +
                    `</div>\n`;
                // The next paragraph is the name: make it the card title.
                const open = tokens[i + 1];
                const inline = tokens[i + 2];
                if (open?.type === "paragraph_open" && inline?.type === "inline") {
                    open.attrJoin("class", "capability-title");
                    const strong = inline.children?.filter((c: Token) => c.type === "strong_open") ?? [];
                    if (strong.length === 1 && inline.children) {
                        inline.children = inline.children.filter(
                            (c: Token) => c.type !== "strong_open" && c.type !== "strong_close",
                        );
                    }
                }
                continue;
            }
            if (END.test(token.content.trim())) {
                token.content = "</div>\n";
            }
        }
    });
}
