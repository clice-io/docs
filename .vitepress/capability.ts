import * as fs from "node:fs";
import * as path from "node:path";
import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it/index.js";
import { escapeHtml, renderFeature, type Marker } from "./snap/render";

/**
 * Capability cards for the generated feature pages.
 *
 * clice's docs generator emits each capability as
 *
 *     <!-- BEGIN CAPABILITY: supported clangd#710 -->
 *     **Name**
 *     details / description paragraphs
 *     ```snap
 *     tests/snap/hover/symbol_information/01_qualified_name.cpp
 *     ```
 *     <!-- END CAPABILITY -->
 *
 * The comments and the fence are byte-identical across the en and zh
 * trees; the paragraphs are translated. Here the comments become the card
 * frame with a status sticker and issue links, the first paragraph becomes
 * the card title, and the fence names a fixture in the project's synced
 * test corpus (`sources/<project>/…`): its source (doc header stripped,
 * `§` markers turned into pins) and its `.snap.yml` are read at build
 * time and handed to the <SnapExample> component, pre-rendered.
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

/** The fixture's example: the source after its `///` doc header and an
 *  optional `// snap:` maintainer comment block. */
function exampleOf(source: string): { example: string; skipped: number } {
    const lines = source.replaceAll("\r\n", "\n").split("\n");
    let i = 0;
    while (i < lines.length && (lines[i]!.startsWith("//") || lines[i]!.trim() === "")) {
        // A `///` doc header, then blank lines; a plain `//` line that is
        // not a `// snap:` block ends the prologue (it is example code).
        const line = lines[i]!;
        if (line.startsWith("///") || line.trim() === "") {
            i += 1;
            continue;
        }
        if (line.trim().startsWith("// snap:")) {
            while (i < lines.length && lines[i]!.trim().startsWith("//")) i += 1;
            continue;
        }
        break;
    }
    const body = lines.slice(i);
    while (body.length > 0 && body[body.length - 1]!.trim() === "") body.pop();
    return { example: body.join("\n"), skipped: i };
}

function snapshotOf(fixture: string): string {
    const snapPath = fixture.replace(/\.cpp$/, ".snap.yml");
    if (!fs.existsSync(snapPath)) return "";
    const text = fs.readFileSync(snapPath, "utf8").replaceAll("\r\n", "\n");
    const match = /^---\n[\s\S]*?\n---\n/.exec(text);
    const lines = (match ? text.slice(match[0].length) : text).trim().split("\n");
    // Two trailing spaces are markdown hard breaks; keep the ones that
    // still break something as backslash breaks.
    return lines
        .map((line, i) => {
            const trimmed = line.trimEnd();
            const breaks =
                / {2,}$/.test(line) && !trimmed.startsWith("#") && (lines[i + 1] ?? "").trim() !== "";
            return breaks ? `${trimmed}\\` : trimmed;
        })
        .join("\n");
}

/** Render one `snap` fence: the named fixture into a SnapExample component. */
function renderSnap(md: MarkdownIt, env: { relativePath?: string }, content: string): string {
    const rel = content.trim();
    const project = String(env.relativePath ?? "").replace(/^zh\//, "").split("/")[0] ?? "";
    const fixture = path.resolve(process.cwd(), "sources", project, rel);
    const feature = rel.split("/")[2] ?? "";
    if (!fs.existsSync(fixture)) {
        return `<SnapExample missing="${escapeHtml(rel)}" />\n`;
    }
    const { example, skipped } = exampleOf(fs.readFileSync(fixture, "utf8"));
    const { code, markers } = parseMarkers(example);
    const rendered = renderFeature(md, feature, code, markers, snapshotOf(fixture), skipped, path.basename(fixture));
    const files: { name: string; html: string }[] = [];
    if (path.basename(fixture) === "main.cpp") {
        const dir = path.dirname(fixture);
        for (const name of fs.readdirSync(dir, { recursive: true, encoding: "utf8" })) {
            const abs = path.join(dir, name);
            if (name === "main.cpp" || !/\.(cpp|cc|h|hpp|cppm|ixx)$/.test(name) || !fs.statSync(abs).isFile()) {
                continue;
            }
            const sibling = parseMarkers(exampleOf(fs.readFileSync(abs, "utf8")).example);
            files.push({
                name: name.split(path.sep).join("/"),
                html: renderFeature(md, "", sibling.code, sibling.markers, "", 0, name).code,
            });
        }
        files.sort((a, b) => a.name.localeCompare(b.name));
    }
    const payload = {
        feature,
        code: rendered.code,
        markers: markers.map((m) => m.name),
        files,
        results: rendered.results,
        layout: rendered.layout,
        legend: rendered.legend,
        source: rel,
    };
    const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    return `<SnapExample data="${encoded}" />\n`;
}

export function capabilityCards(md: MarkdownIt): void {
    const fence = md.renderer.rules.fence!;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]!;
        if (token.info.trim() === "snap") {
            return renderSnap(md, env as { relativePath?: string }, token.content);
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
