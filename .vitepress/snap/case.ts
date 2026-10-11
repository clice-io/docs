import type MarkdownIt from "markdown-it";
import { decorate, escapeHtml, pinInserts, type Insert, type Rendered, type Result } from "./render";

/**
 * Example cards for the cases of clice's tests: a ```case fence names a
 * case, whose card (written by clice's cases run as
 * `sources/<project>/cases/<id>.json`) carries the sources with their
 * markers' offsets and the output block by block, each place as
 * `{ $place, path, range }`. Nothing here reads snap.toml's text.
 *
 * A block answering at a marker draws its places into the code, shown
 * while its pin is active; a place's sibling `kind` (a highlight's) styles
 * it.
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

interface CardPlace {
    $place: string;
    path: string;
    range: { start: Position; end: Position };
}

type CardValue = string | number | boolean | CardPlace | CardValue[] | { [key: string]: CardValue };

export interface CardBlock {
    label: string;
    marker?: string;
    value: { [key: string]: CardValue };
}

export interface Card {
    id: string;
    topic: string;
    status: string;
    files: CardFile[];
    tests: { name: string; blocks: CardBlock[] }[];
}

function isPlace(value: CardValue): value is CardPlace {
    return typeof value === "object" && value !== null && !Array.isArray(value) && "$place" in value;
}

/** Every place in `value`, with the `kind` of the table holding it. */
function placesOf(value: CardValue, kind = ""): { place: CardPlace; note: string }[] {
    if (isPlace(value)) return [{ place: value, note: kind }];
    if (Array.isArray(value)) return value.flatMap((item) => placesOf(item, kind));
    if (typeof value === "object" && value !== null) {
        const note = typeof value.kind === "string" ? value.kind : "";
        return Object.values(value).flatMap((item) => placesOf(item, note));
    }
    return [];
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

export interface CaseRendered extends Rendered {
    markers: string[];
    files: { name: string; html: string }[];
}

const SOURCE = /\.(c|cc|cpp|cxx|cppm|ixx|h|hh|hpp|hxx)$/;
const NOTE = /^[a-z]+$/;

const KINDS: Record<string, Record<string, string>> = {
    en: { read: "read", write: "write", text: "declaration", none: "No highlights" },
    zh: { read: "读", write: "写", text: "声明", none: "没有高亮" },
};

/** The file the card opens with: the case's entry, else its first marked source. */
function entryOf(card: Card): CardFile | undefined {
    return (
        card.files.find((file) => /^main\.[a-z]+$/.test(file.path)) ??
        card.files.find((file) => file.markers.length > 0) ??
        card.files.find((file) => SOURCE.test(file.path))
    );
}

/** A place as open/close inserts, one pair per line it spans. */
function placeInserts(text: string, place: CardPlace, note: string, marker: string): Insert[] {
    const lines = text.split("\n");
    const { start, end } = place.range;
    const kind = NOTE.test(note) ? ` kind-${note}` : "";
    const out: Insert[] = [];
    for (let line = start.line; line <= end.line; line += 1) {
        const from = line === start.line ? start.character : 0;
        const to = line === end.line ? end.character : (lines[line]?.length ?? 0);
        if (to <= from) continue;
        out.push({
            line,
            col: from,
            html: `<span class="mark-range${kind}" data-for="${escapeHtml(marker)}">`,
            order: 6,
        });
        out.push({ line, col: to, html: "</span>", order: 1 });
    }
    return out;
}

function highlightSummary(block: CardBlock, lang: string): string {
    const names = KINDS[lang] ?? KINDS.en!;
    const counts = new Map<string, number>();
    for (const { note } of placesOf(block.value.highlights ?? [])) {
        counts.set(note, (counts.get(note) ?? 0) + 1);
    }
    if (counts.size === 0) return `<p class="snap-none">${escapeHtml(names.none!)}</p>`;
    return [...counts]
        .map(([kind, n]) => `<span class="case-kind kind-${kind}">${escapeHtml(names[kind] ?? kind)} ×${n}</span>`)
        .join(" ");
}

function resultOf(card: Card, block: CardBlock, lang: string): Result & { label: string } {
    const { wrong, ...answer } = block.value;
    const flag = typeof wrong === "string" ? `<p class="case-wrong">✗ ${escapeHtml(wrong)}</p>` : "";
    const body =
        card.topic === "document_highlight"
            ? highlightSummary(block, lang)
            : `<pre class="snap-raw"><code>${escapeHtml(JSON.stringify(plainOf(answer), null, 2))}</code></pre>`;
    return {
        name: block.marker ?? block.label,
        label: block.marker ? "" : block.label,
        meta: "",
        html: flag + body,
    };
}

export function renderCard(md: MarkdownIt, card: Card, lang: string): CaseRendered {
    const entry = entryOf(card);
    const shown = [entry, ...card.files.filter((file) => file !== entry && (SOURCE.test(file.path) || file.markers.length > 0))].filter(
        (file): file is CardFile => file !== undefined,
    );
    const markers = shown.flatMap((file) => file.markers.map((m) => m.name));
    const blocks = card.tests.flatMap((test) => test.blocks);
    const html = new Map<string, string>();
    let first = 0;
    for (const file of shown) {
        const inserts = pinInserts(
            file.text,
            file.markers.map((m) => (m.range ? { name: m.name, offset: m.begin, end: m.end } : { name: m.name, offset: m.begin })),
            first,
        );
        first += file.markers.length;
        for (const block of blocks) {
            if (!block.marker) continue;
            for (const { place, note } of placesOf(block.value)) {
                if (place.path === file.path) inserts.push(...placeInserts(file.text, place, note, block.marker));
            }
        }
        html.set(file.path, decorate(md, file.text.replace(/\n$/, ""), inserts));
    }
    const answered = blocks.length > 0 && blocks.every((block) => block.marker);
    return {
        code: entry ? (html.get(entry.path) ?? "") : "",
        files: shown.slice(1).map((file) => ({ name: file.path, html: html.get(file.path) ?? "" })),
        markers,
        results: blocks.map((block) => resultOf(card, block, lang)),
        layout: answered ? (card.topic === "document_highlight" ? "inline" : "tooltip") : "split",
        legend:
            card.topic === "document_highlight"
                ? ["read", "write", "text"].map((kind) => ({
                      label: (KINDS[lang] ?? KINDS.en!)[kind]!,
                      cls: `case-kind kind-${kind}`,
                  }))
                : [],
    };
}
