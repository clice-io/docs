/// The en↔zh contract: a Chinese page is segment-isomorphic to its English
/// counterpart, and the meta tree attests each translatable pair by hash.
/// `check`, `report` and `record` live here; RULES.md states the contract
/// for writers.

import * as fs from "node:fs";
import * as path from "node:path";
import { analyzeSource, pairedLabels, type SegmentInfo } from "./segment.ts";

export interface Layout {
    en: string;
    zh: string;
    meta: string;
    /// Globs of page paths, relative to the en and zh roots, left out of
    /// the contract: the tool treats a matching page as absent from both
    /// trees.
    ignore: string[];
}

interface Pair {
    kind: string;
    en: string;
    zh: string;
}

export interface Mapping {
    version: number;
    pairs: Pair[];
}

function isIgnored(layout: Layout, page: string): boolean {
    return layout.ignore.some((glob) => path.matchesGlob(page, glob));
}

function listFiles(root: string, extension: string): string[] {
    if (!fs.existsSync(root)) {
        return [];
    }
    const files: string[] = [];
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.name.endsWith(extension)) {
                files.push(path.relative(root, full).split(path.sep).join("/"));
            }
        }
    };
    walk(root);
    return files.sort();
}

/// The pages under the contract: every en page no ignore glob matches.
export function listPages(layout: Layout): string[] {
    return listFiles(layout.en, ".md").filter((page) => !isIgnored(layout, page));
}

function mappingPath(layout: Layout, page: string): string {
    return path.join(layout.meta, page.replace(/\.md$/, ".json"));
}

export function loadMapping(layout: Layout, page: string): Mapping | null {
    const file = mappingPath(layout, page);
    if (!fs.existsSync(file)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(file, "utf8")) as Mapping;
}

/// One pair per line so an edited segment shows up as exactly one changed
/// line in the diff.
/// The mapping in the layout prettier gives JSON at printWidth 100, so a
/// formatter pass never rewrites what `record` wrote: one pair per line,
/// except that an array short enough for one line (a page with a single
/// segment) stays on that line, as prettier collapses it.
function serializeMapping(pairs: Pair[]): string {
    const entries = pairs.map(
        (pair) =>
            `{ "kind": ${JSON.stringify(pair.kind)}, ` +
            `"en": ${JSON.stringify(pair.en)}, "zh": ${JSON.stringify(pair.zh)} }`,
    );
    const oneLine = `  "pairs": [${entries.join(", ")}]`;
    const array =
        oneLine.length <= 100
            ? oneLine
            : `  "pairs": [\n${entries.map((entry) => `    ${entry}`).join(",\n")}\n  ]`;
    return `{\n  "version": 1,\n${array}\n}\n`;
}

function zip<A, B>(a: A[], b: B[]): [A, B][] {
    const out: [A, B][] = [];
    const length = Math.min(a.length, b.length);
    for (let i = 0; i < length; i += 1) {
        const left = a.at(i);
        const right = b.at(i);
        if (left !== undefined && right !== undefined) {
            out.push([left, right]);
        }
    }
    return out;
}

export function mustGet<K, V>(map: Map<K, V>, key: K): V {
    const value = map.get(key);
    if (value === undefined) {
        throw new Error(`missing ${String(key)}`);
    }
    return value;
}

/// Indexing that cannot be out of range by construction.
export function at<T>(items: T[], i: number): T {
    const item = items[i];
    if (item === undefined) {
        throw new Error(`index ${i} out of range`);
    }
    return item;
}

interface LabelDiff {
    /// The one name en gives both segments.
    name: string;
    row: SegmentInfo;
    heading: SegmentInfo;
}

interface LiteralDiff {
    left: SegmentInfo;
    right: SegmentInfo;
    /// What zh changed against en, as literalChanges words it.
    changes: string;
}

interface TreeComparison {
    /// Human-readable description of a block-layout divergence, or null
    /// when the two sides are isomorphic.
    structureProblem: string | null;
    /// Segment pairs whose verbatim bytes differ (structure was isomorphic).
    verbatimDiffs: [SegmentInfo, SegmentInfo][];
    /// zh row/heading pairs named alike in en but not in zh (structure was
    /// isomorphic).
    labelDiffs: LabelDiff[];
    /// Segment pairs whose inline literals differ (structure was
    /// isomorphic).
    literalDiffs: LiteralDiff[];
}

export function labelProblem(diff: LabelDiff): string {
    return (
        `table row (zh line ${diff.row.line}) and heading (zh line ${diff.heading.line}) ` +
        `are both "${diff.name}" in en but "${diff.row.label ?? ""}" and ` +
        `"${diff.heading.label ?? ""}" in zh — give them one name`
    );
}

/// The literals zh dropped from and added to en's set, or null when the
/// sets agree.
export function literalChanges(en: string[], zh: string[]): string | null {
    const dropped = en.filter((literal) => !zh.includes(literal));
    const added = zh.filter((literal) => !en.includes(literal));
    if (dropped.length === 0 && added.length === 0) {
        return null;
    }
    return [
        ...dropped.map((literal) => `dropped ${literal}`),
        ...added.map((literal) => `added ${literal}`),
    ].join(", ");
}

export function literalProblem(diff: LiteralDiff): string {
    return `${segmentLabel(diff.left, diff.right)}: inline literals differ — ${diff.changes}`;
}

function describe(info: SegmentInfo | undefined): string {
    return info === undefined ? "ends" : `has ${info.shape} (line ${info.line})`;
}

function sameVerbatim(left: SegmentInfo, right: SegmentInfo): boolean {
    return (
        left.verbatim.length === right.verbatim.length &&
        left.verbatim.every((text, i) => text === right.verbatim.at(i))
    );
}

export function compareTrees(en: SegmentInfo[], zh: SegmentInfo[]): TreeComparison {
    const total = Math.max(en.length, zh.length);
    for (let i = 0; i < total; i += 1) {
        const left = en.at(i);
        const right = zh.at(i);
        if (left?.shape !== right?.shape) {
            return {
                structureProblem:
                    `segment layouts diverge at segment ${i + 1}: ` +
                    `en ${describe(left)}, zh ${describe(right)} — ` +
                    `en has ${en.length} segments, zh has ${zh.length}`,
                verbatimDiffs: [],
                labelDiffs: [],
                literalDiffs: [],
            };
        }
    }
    const labelDiffs: LabelDiff[] = [];
    for (const [r, h] of pairedLabels(en)) {
        const row = at(zh, r);
        const heading = at(zh, h);
        if (row.label !== heading.label) {
            labelDiffs.push({ name: at(en, r).label ?? "", row, heading });
        }
    }
    const pairs = zip(en, zh);
    const literalDiffs: LiteralDiff[] = [];
    for (const [left, right] of pairs) {
        const changes = literalChanges(left.literals, right.literals);
        if (changes !== null) {
            literalDiffs.push({ left, right, changes });
        }
    }
    return {
        structureProblem: null,
        verbatimDiffs: pairs.filter(([left, right]) => !sameVerbatim(left, right)),
        labelDiffs,
        literalDiffs,
    };
}

interface PageAnalysis extends TreeComparison {
    page: string;
    en: SegmentInfo[];
    /// null when the Chinese page does not exist.
    zh: SegmentInfo[] | null;
    mapping: Mapping | null;
}

function analyzePage(layout: Layout, page: string): PageAnalysis {
    const en = analyzeSource(fs.readFileSync(path.join(layout.en, page), "utf8"), page);
    const mapping = loadMapping(layout, page);
    const zhFile = path.join(layout.zh, page);
    if (!fs.existsSync(zhFile)) {
        return {
            page,
            en,
            zh: null,
            mapping,
            structureProblem: null,
            verbatimDiffs: [],
            labelDiffs: [],
            literalDiffs: [],
        };
    }
    const zh = analyzeSource(fs.readFileSync(zhFile, "utf8"), `zh/${page}`);
    return { page, en, zh, mapping, ...compareTrees(en, zh) };
}

function translatable(segments: SegmentInfo[]): SegmentInfo[] {
    return segments.filter((segment) => segment.translatable);
}

function segmentLabel(left: SegmentInfo, right: SegmentInfo): string {
    return `segment ${left.index} (${left.kind}, en line ${left.line} / zh line ${right.line})`;
}

export function verbatimLabel(left: SegmentInfo, right: SegmentInfo): string {
    return left.translatable
        ? `verbatim block inside ${segmentLabel(left, right)}`
        : `verbatim ${segmentLabel(left, right)}`;
}

function verbatimReason(left: SegmentInfo): string {
    return left.translatable
        ? "nested code or comment must be byte-identical"
        : "verbatim segment must be byte-identical";
}

/// Positional comparison of a recorded pair against the current segments.
/// Only meaningful when the pair count still matches the page.
function driftOf(pair: Pair, left: SegmentInfo, right: SegmentInfo): string | null {
    if (pair.kind !== left.kind) {
        return `recorded as ${pair.kind}, now ${left.kind} — review the page pair, then run record`;
    }
    const enChanged = pair.en !== left.hash;
    const zhChanged = pair.zh !== right.hash;
    if (enChanged && zhChanged) {
        return "both sides changed since last record — verify they still correspond";
    }
    if (enChanged) {
        return "English changed since last record — update the Chinese to match";
    }
    if (zhChanged) {
        return "Chinese changed since last record — confirm it still translates the English";
    }
    return null;
}

interface StrayFiles {
    zhPages: string[];
    mappings: string[];
}

function findStrays(layout: Layout, pages: string[]): StrayFiles {
    const knownPages = new Set(pages);
    const expectedMappings = new Set(pages.map((page) => page.replace(/\.md$/, ".json")));
    return {
        zhPages: listFiles(layout.zh, ".md").filter(
            (file) => !knownPages.has(file) && !isIgnored(layout, file),
        ),
        mappings: listFiles(layout.meta, ".json").filter((file) => !expectedMappings.has(file)),
    };
}

function strayMessages(layout: Layout, pages: string[]): string[] {
    const strays = findStrays(layout, pages);
    return [
        ...strays.zhPages.map(
            (stray) => `zh/${stray}: no English counterpart — remove it or add the English page`,
        ),
        ...strays.mappings.map(
            (stray) => `meta stray ${stray}: no English counterpart — run record to clean up`,
        ),
    ];
}

export function check(layout: Layout, pages: string[]): number {
    const problems: string[] = [];
    let attested = 0;
    for (const page of pages) {
        const analysis = analyzePage(layout, page);
        if (analysis.zh === null) {
            problems.push(`${page}: Chinese page is missing`);
            continue;
        }
        if (analysis.structureProblem !== null) {
            problems.push(`${page}: ${analysis.structureProblem}`);
            continue;
        }
        for (const [left, right] of analysis.verbatimDiffs) {
            problems.push(
                `${page}: ${verbatimLabel(left, right)} must be byte-identical between en and zh`,
            );
        }
        for (const diff of analysis.labelDiffs) {
            problems.push(`${page}: ${labelProblem(diff)}`);
        }
        for (const diff of analysis.literalDiffs) {
            problems.push(`${page}: ${literalProblem(diff)}`);
        }
        const pairsNow = zip(translatable(analysis.en), translatable(analysis.zh));
        if (analysis.mapping === null) {
            problems.push(`${page}: not recorded — translate, review, then run record`);
            continue;
        }
        if (analysis.mapping.version !== 1) {
            problems.push(`${page}: unsupported mapping version ${analysis.mapping.version}`);
            continue;
        }
        if (analysis.mapping.pairs.length !== pairsNow.length) {
            problems.push(
                `${page}: mapping records ${analysis.mapping.pairs.length} pairs but ` +
                    `the page now has ${pairsNow.length} translatable segments — ` +
                    `review the page pair, then run record`,
            );
            continue;
        }
        for (const [pair, [left, right]] of zip(analysis.mapping.pairs, pairsNow)) {
            const drift = driftOf(pair, left, right);
            if (drift !== null) {
                problems.push(`${page}: ${segmentLabel(left, right)}: ${drift}`);
            } else {
                attested += 1;
            }
        }
    }
    problems.push(...strayMessages(layout, pages));
    if (problems.length > 0) {
        for (const problem of problems) {
            console.error(problem);
        }
        console.error(`${problems.length} problems`);
        return 1;
    }
    console.log(
        `${layout.zh} matches ${layout.en} ` +
            `(${pages.length} pages, ${attested} attested segment pairs)`,
    );
    return 0;
}

function quoted(label: string, text: string): string {
    const first = `    ${label} | `;
    const continuation = " ".repeat(label.length + 4) + " | ";
    return text
        .split("\n")
        .map((line, i) => (i === 0 ? first : continuation) + line)
        .join("\n");
}

function reportDrift(left: SegmentInfo, right: SegmentInfo, reason: string): void {
    console.log(`  ${segmentLabel(left, right)} — ${reason}`);
    console.log(quoted("en", left.text));
    console.log(quoted("zh", right.text));
}

export function report(layout: Layout, pages: string[]): number {
    let untranslatedPages = 0;
    let driftedSegments = 0;
    let cleanPages = 0;
    for (const page of pages) {
        const analysis = analyzePage(layout, page);
        if (analysis.zh === null) {
            console.log(
                `${page}: Chinese page missing ` +
                    `(${translatable(analysis.en).length} segments to translate)`,
            );
            untranslatedPages += 1;
            continue;
        }
        if (analysis.structureProblem !== null) {
            console.log(`${page}: ${analysis.structureProblem}`);
            console.log("    bring the Chinese page to the same block layout, then rerun");
            untranslatedPages += 1;
            continue;
        }
        let pageDrifts = 0;
        const flag = (print: () => void) => {
            if (pageDrifts === 0) {
                console.log(`${page}:`);
            }
            print();
            pageDrifts += 1;
        };
        const drifted = (left: SegmentInfo, right: SegmentInfo, reason: string) => {
            flag(() => {
                reportDrift(left, right, reason);
            });
        };
        for (const [left, right] of analysis.verbatimDiffs) {
            drifted(left, right, verbatimReason(left));
        }
        for (const diff of analysis.labelDiffs) {
            flag(() => {
                console.log(`  ${labelProblem(diff)}`);
            });
        }
        for (const diff of analysis.literalDiffs) {
            drifted(diff.left, diff.right, `inline literals differ — ${diff.changes}`);
        }
        const pairsNow = zip(translatable(analysis.en), translatable(analysis.zh));
        if (analysis.mapping?.version !== 1) {
            const status =
                analysis.mapping === null
                    ? "not recorded"
                    : `unsupported mapping version ${analysis.mapping.version}`;
            console.log(
                `${page}: ${status} (${pairsNow.length} segments) — ` +
                    `review the translation, then run record`,
            );
            untranslatedPages += 1;
            driftedSegments += pageDrifts;
            continue;
        }
        if (analysis.mapping.pairs.length !== pairsNow.length) {
            // Positions shifted (segments were added or removed), so pair
            // them by content instead: anything not covered by a recorded
            // pair needs review.
            const recorded = new Map<string, number>();
            for (const pair of analysis.mapping.pairs) {
                const key = `${pair.en}:${pair.zh}`;
                recorded.set(key, (recorded.get(key) ?? 0) + 1);
            }
            console.log(
                `${page}: layout changed since last record ` +
                    `(${analysis.mapping.pairs.length} pairs recorded, ` +
                    `${pairsNow.length} segments now); segments not covered:`,
            );
            for (const [left, right] of pairsNow) {
                const key = `${left.hash}:${right.hash}`;
                const remaining = recorded.get(key) ?? 0;
                if (remaining > 0) {
                    recorded.set(key, remaining - 1);
                } else {
                    reportDrift(left, right, "no recorded pair");
                    pageDrifts += 1;
                }
            }
            const removed = [...recorded.values()].reduce((sum, count) => sum + count, 0);
            if (removed > 0) {
                console.log(`  ${removed} recorded pairs are no longer on the page`);
                pageDrifts += removed;
            }
            driftedSegments += pageDrifts;
            continue;
        }
        for (const [pair, [left, right]] of zip(analysis.mapping.pairs, pairsNow)) {
            const drift = driftOf(pair, left, right);
            if (drift !== null) {
                drifted(left, right, drift);
            }
        }
        driftedSegments += pageDrifts;
        if (pageDrifts === 0) {
            cleanPages += 1;
        }
    }
    for (const message of strayMessages(layout, pages)) {
        console.log(message);
    }
    console.log(
        `${cleanPages} pages clean, ${untranslatedPages} pages untranslated or ` +
            `unrecorded, ${driftedSegments} drifted segments`,
    );
    return 0;
}

export function record(layout: Layout, pages: string[]): number {
    let failed = false;
    for (const page of pages) {
        const analysis = analyzePage(layout, page);
        if (analysis.zh === null) {
            console.error(`${page}: Chinese page is missing — nothing to record`);
            failed = true;
            continue;
        }
        if (analysis.structureProblem !== null) {
            console.error(`${page}: ${analysis.structureProblem}`);
            failed = true;
            continue;
        }
        const problems = [
            ...analysis.verbatimDiffs.map(
                ([left, right]) =>
                    `${verbatimLabel(left, right)} must be byte-identical — fix before recording`,
            ),
            ...analysis.labelDiffs.map(labelProblem),
            ...analysis.literalDiffs.map(literalProblem),
        ];
        if (problems.length > 0) {
            for (const problem of problems) {
                console.error(`${page}: ${problem}`);
            }
            failed = true;
            continue;
        }
        const pairs = zip(translatable(analysis.en), translatable(analysis.zh)).map(
            ([left, right]) => ({ kind: left.kind, en: left.hash, zh: right.hash }),
        );
        const serialized = serializeMapping(pairs);
        const file = mappingPath(layout, page);
        if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === serialized) {
            continue;
        }
        const oldEn = new Set(analysis.mapping?.pairs.map((pair) => pair.en) ?? []);
        const oldZh = new Set(analysis.mapping?.pairs.map((pair) => pair.zh) ?? []);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, serialized);
        const enSide = pairs.filter((pair) => !oldEn.has(pair.en)).length;
        const zhSide = pairs.filter((pair) => !oldZh.has(pair.zh)).length;
        const detail =
            analysis.mapping === null ? "new page" : `${enSide} en-side, ${zhSide} zh-side changes`;
        console.log(`${page}: recorded ${pairs.length} pairs (${detail})`);
    }
    for (const stray of findStrays(layout, pages).mappings) {
        fs.rmSync(path.join(layout.meta, stray));
        console.log(`removed stray mapping ${stray}`);
    }
    return failed ? 1 : 0;
}
