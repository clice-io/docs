import * as fs from "node:fs";
import * as path from "node:path";
import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it/index.js";

/**
 * zh headings take the anchors of their en counterparts.
 *
 * The zh tree mirrors the en one page for page and section for section, and
 * its links are the en links byte for byte, `query.md#locators` included;
 * VitePress slugs each heading from its own text, so `## 定位符` became
 * `#定位符` and every such link opened the page at its top. Here a zh page's
 * headings, paired in order with its en page's, take the en ids; the
 * Chinese slug stays reachable as an empty element inside the heading.
 *
 * A page whose headings do not pair (no en page, or a different count or
 * order of levels) keeps its own anchors, with a warning in the build log.
 */

interface Heading {
    level: number;
    id: string;
}

function headingsOf(tokens: Token[]): Heading[] {
    return tokens
        .filter((token) => token.type === "heading_open" && token.attrGet("id"))
        .map((token) => ({ level: Number(token.tag.slice(1)), id: token.attrGet("id")! }));
}

const warned = new Set<string>();

function warn(page: string, why: string): void {
    const key = `${page}: ${why}`;
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(`[zh anchors] ${page}: ${why}; its headings keep their own anchors`);
}

export function pairedAnchors(md: MarkdownIt, srcDir: string): void {
    md.core.ruler.after("anchor", "paired_anchors", (state) => {
        const env = state.env as { relativePath?: string };
        const page = String(env.relativePath ?? "");
        if (!page.startsWith("zh/")) return;
        const zhOpen = state.tokens.filter((token) => token.type === "heading_open" && token.attrGet("id"));
        if (zhOpen.length === 0) return;

        const enFile = path.join(srcDir, "en", page.slice("zh/".length));
        if (!fs.existsSync(enFile)) {
            warn(page, "no en page to pair with");
            return;
        }
        // The en page parsed as VitePress renders it, for the ids it gets:
        // without its frontmatter, which VitePress takes off before rendering.
        const source = fs.readFileSync(enFile, "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/, "");
        const en = headingsOf(md.parse(source, { relativePath: path.relative(srcDir, enFile) }));
        const zh = headingsOf(zhOpen);
        if (en.length !== zh.length || en.some((h, i) => h.level !== zh[i]!.level)) {
            warn(page, `${zh.length} headings against the en page's ${en.length}, or their levels differ`);
            return;
        }

        const taken = new Set(en.map((h) => h.id));
        zhOpen.forEach((open, i) => {
            const own = open.attrGet("id")!;
            const id = en[i]!.id;
            if (own === id) return;
            open.attrSet("id", id);
            const inline = state.tokens[state.tokens.indexOf(open) + 1];
            const children = inline?.children ?? [];
            // the heading's own permalink
            for (const child of children) {
                if (child.type === "link_open" && child.attrGet("href") === `#${own}`) child.attrSet("href", `#${id}`);
            }
            // the Chinese slug, for links that already use it
            if (!taken.has(own)) {
                const alias = new state.Token("html_inline", "", 0);
                alias.content = `<span id="${md.utils.escapeHtml(own)}" class="heading-alias"></span>`;
                children.unshift(alias);
            }
        });
    });
}
