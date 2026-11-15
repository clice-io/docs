import * as fs from "node:fs";
import yaml from "js-yaml";

/**
 * A page's description for search engines and link previews, when its
 * frontmatter gives none: a home page's hero (`text. tagline`), else the
 * page's first paragraph of prose, without its markdown. The synced pages
 * carry no descriptions, and without one every page previewed with the
 * site's tagline.
 */

const LATIN_MAX = 200;
const CJK_MAX = 110;

/** Markdown inline syntax off: links and images to their text, emphasis,
 *  code ticks and HTML tags dropped. */
function plain(text: string): string {
    return text
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[\^[^\]]+\]/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/(\*\*|__)(.+?)\1/g, "$2")
        .replace(/(\*|_)(.+?)\1/g, "$2")
        .replace(/`([^`]*)`/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}

/** At most `max` characters, cut at the last sentence end that leaves
 *  most of it, else at a word, with an ellipsis. */
function clip(text: string): string {
    const cjk = (text.match(/[㐀-鿿]/g)?.length ?? 0) > text.length / 4;
    const max = cjk ? CJK_MAX : LATIN_MAX;
    // A paragraph leading into a list goes on: say so.
    const whole = text.replace(/[:：]$/, "…");
    if (whole.length <= max) return whole;
    const head = whole.slice(0, max);
    const end = Math.max(head.lastIndexOf(". "), head.lastIndexOf("。"));
    if (end > max * 0.6) return head.slice(0, end + 1);
    // Latin text breaks at a space; CJK anywhere, but not inside a Latin word.
    let cut = cjk ? max - 1 : head.lastIndexOf(" ");
    if (cjk) while (cut > max * 0.6 && /[A-Za-z0-9]/.test(head[cut - 1]!) && /[A-Za-z0-9]/.test(head[cut]!)) cut -= 1;
    return `${head.slice(0, cut > max * 0.6 ? cut : max - 1).replace(/[,，;；:：、\s]+$/, "")}…`;
}

function firstParagraph(body: string): string {
    let fence = false;
    for (const block of body.split(/\n\s*\n/)) {
        const text = block.trim();
        const fences = (text.match(/^(```|~~~)/gm) ?? []).length;
        if (fence || fences % 2 === 1) {
            if (fences % 2 === 1) fence = !fence;
            continue;
        }
        // Prose only: no heading, list, table, quote, fence, container,
        // HTML or component, image.
        if (!text || /^(#|[-*+] |\d+\. |\||>|```|~~~|:::|<|!\[|\[\^)/.test(text)) continue;
        const prose = plain(text);
        if (prose.length >= 20) return prose;
    }
    return "";
}

export function excerptOf(file: string): string {
    if (!fs.existsSync(file)) return "";
    const source = fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
    const match = /^---\n([\s\S]*?)\n---(\n|$)/.exec(source);
    const front = (match ? yaml.load(match[1]!) : null) as { hero?: { text?: string; tagline?: string } } | null;
    const hero = front?.hero;
    if (hero?.text || hero?.tagline) {
        const parts = [hero.text, hero.tagline].filter((part): part is string => !!part).map(plain);
        const cjk = /[㐀-鿿]/.test(parts.join(""));
        // `text` is a title: it takes a full stop before the tagline.
        const joined = parts.map((part, i) => (i < parts.length - 1 && !/[.。!！?？]$/.test(part) ? part + (cjk ? "。" : ".") : part));
        return clip(joined.join(cjk ? "" : " "));
    }
    const paragraph = firstParagraph(match ? source.slice(match[0].length) : source);
    return paragraph ? clip(paragraph) : "";
}
