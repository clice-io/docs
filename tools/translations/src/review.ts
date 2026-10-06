/// `review` re-reads every translatable segment of an existing zh page
/// next to its en counterpart and asks a model for the corrected Chinese —
/// meaning, the wording rules of RULES.md and the repository's glossary,
/// naturalness — segment by segment, so no code block ever enters the
/// model's context. It is also how a new or restructured page gets
/// translated: copy the en page over the zh one and review it. The
/// backend runs the codex CLI (GPT-6 astra) with every tool switched
/// off, one call per chunk of segments (a paired row and heading always
/// in the same chunk). A reply that breaks a segment's shape, alters an
/// inline literal, or names a row and its heading differently keeps the
/// current Chinese. A segment that ends up as the English copy — kept, or
/// accepted as the model's echo — counts the page as failed unless the
/// mapping already attests that pair as verbatim (a heading that is a
/// product name, a row made of code spans), so a draft never exits green
/// with untranslated segments. The pages are rewritten in place; review
/// the diff, then `record`.

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import pLimit from "p-limit";
import {
    at,
    compareTrees,
    labelProblem,
    literalChanges,
    literalProblem,
    loadMapping,
    mustGet,
    verbatimLabel,
    type Layout,
} from "./contract.ts";
import {
    analyzeSource,
    hashSegment,
    pairedLabels,
    splitSegments,
    YAML_PROSE_KEYS,
    type Segment,
} from "./segment.ts";

export interface ReviewOptions {
    /// Pages to review; every page when empty.
    pages: string[];
    /// The repository's terms and page conventions, appended to the prompt.
    glossary: string | null;
    jobs: number;
    effort: string;
    fast: boolean;
}

function parseSegmentsJson(raw: string, expected: number[]): Map<number, string> {
    const cleaned = raw
        .trim()
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    const data = JSON.parse(cleaned) as { segments?: unknown };
    const out = new Map<number, string>();
    if (Array.isArray(data.segments)) {
        for (const item of data.segments as unknown[]) {
            if (typeof item !== "object" || item === null) {
                continue;
            }
            const entry = item as { i?: unknown; text?: unknown };
            if (typeof entry.i === "number" && typeof entry.text === "string") {
                out.set(entry.i, entry.text.replace(/\n+$/, ""));
            }
        }
    }
    for (const i of expected) {
        if (!out.has(i)) {
            throw new Error(`missing segment ${i} in response`);
        }
    }
    return out;
}

/// Code blocks nested in a translatable segment (a snap example under a
/// capability's text) never round-trip through the model: each
/// is masked to a placeholder and restored byte-for-byte afterwards.
interface MaskedText {
    masked: string;
    blocks: string[];
}

function maskCode(text: string, segment: Segment): MaskedText {
    if (/⟦B\d+⟧/.test(text)) {
        throw new Error("segment already contains placeholder-like text ⟦B…⟧");
    }
    const blocks: string[] = [];
    let masked = "";
    let cursor = 0;
    for (const range of segment.verbatim) {
        const start = range.start - segment.start;
        const end = range.end - segment.start;
        masked += text.slice(cursor, start);
        blocks.push(text.slice(start, end));
        masked += `⟦B${blocks.length}⟧`;
        cursor = end;
    }
    masked += text.slice(cursor);
    return { masked, blocks };
}

function restoreCode(masked: string, blocks: string[]): { text: string } | { problem: string } {
    const seen = new Map<string, number>();
    for (const found of masked.match(/⟦B\d+⟧/g) ?? []) {
        seen.set(found, (seen.get(found) ?? 0) + 1);
    }
    for (let index = 0; index < blocks.length; index += 1) {
        const placeholder = `⟦B${index + 1}⟧`;
        const count = seen.get(placeholder) ?? 0;
        if (count !== 1) {
            return {
                problem: `placeholder ${placeholder} ${count === 0 ? "missing" : "duplicated"}`,
            };
        }
        seen.delete(placeholder);
    }
    if (seen.size > 0) {
        return { problem: `unknown placeholder ${[...seen.keys()].join(" ")}` };
    }
    const text = masked.replace(/⟦B(\d+)⟧/g, (_, n: string) => at(blocks, Number(n) - 1));
    return { text };
}

/// A translated segment re-parsed on its own. A lone row does not parse
/// as a table row: put it under the header and delimiter line the page
/// gives it (dropped from the result again), so a row that would stop
/// the page being a table fails here instead of at the page level.
function parseStandalone(en: Segment, text: string): { probe: string; segments: Segment[] } {
    const align = /^tableRow:\d+:([lrc-]*)$/.exec(en.shape)?.[1];
    if (align === undefined) {
        return { probe: text, segments: splitSegments(text, "reply") };
    }
    const delimiter = (column: string) =>
        column === "l"
            ? " :--- |"
            : column === "r"
              ? " ---: |"
              : column === "c"
                ? " :---: |"
                : " --- |";
    const header = `|${" |".repeat(align.length)}\n|${Array.from(align, delimiter).join("")}\n`;
    const probe = header + text;
    return { probe, segments: splitSegments(probe, "reply").slice(1) };
}

function labelOf(en: Segment, text: string): string | null {
    return parseStandalone(en, text).segments.at(0)?.label ?? null;
}

/// Re-parse the translated segment standalone and reject anything that
/// broke the shape the isomorphism contract depends on or touched a
/// literal the prose must carry over.
function validateSegment(
    en: Segment,
    enText: string,
    zhText: string,
    blocks: string[],
): string | null {
    if (zhText.trim() === "") {
        return "empty";
    }
    if (/\n\s*\n/.test(zhText) && !/\n\s*\n/.test(enText)) {
        return "introduced blank line";
    }
    const { probe, segments } = parseStandalone(en, zhText);
    const reply = segments.at(0);
    if (segments.length !== 1 || reply?.shape !== en.shape) {
        return `not a single ${en.shape}`;
    }
    const code = reply.verbatim.map((range) => probe.slice(range.start, range.end));
    if (code.length !== blocks.length || code.some((text, i) => text !== blocks.at(i))) {
        return "nested verbatim block altered";
    }
    const changes = literalChanges(en.literals, reply.literals);
    if (changes !== null) {
        return `inline literals changed: ${changes}`;
    }
    return null;
}

/// Packs segments into chunks of at most `budget` characters in document
/// order. A paired row and heading travel as one unit at the row's
/// position, so a request always sees both names together.
function chunkSegments(
    indices: number[],
    pairs: [number, number][],
    size: (i: number) => number,
    budget: number,
): number[][] {
    const partner = new Map(pairs);
    const pulled = new Set(pairs.map(([, heading]) => heading));
    const chunks: number[][] = [];
    let current: number[] = [];
    let used = 0;
    for (const i of indices) {
        if (pulled.has(i)) {
            continue;
        }
        const heading = partner.get(i);
        const unit = heading === undefined ? [i] : [i, heading];
        const length = unit.reduce((sum, j) => sum + size(j), 0);
        if (current.length > 0 && used + length > budget) {
            chunks.push(current);
            current = [];
            used = 0;
        }
        current.push(...unit);
        used += length;
    }
    if (current.length > 0) {
        chunks.push(current);
    }
    return chunks;
}

/// The rules every repository shares (RULES.md, "Chinese wording");
/// a repository's own terms arrive through the glossary.
const REVIEW_PROMPT = `你在审校一份技术文档的中文译文。输入是一批分段，每段给出编号 i、
markdown 形状 shape、英文原文 en 和当前中文 zh。请逐段判断中文是否准确、术语是否合规、是否自然，
输出每一段的最终中文；已经合格的段原样返回。只输出一个 JSON 对象：
{"segments":[{"i":编号,"text":"最终中文"}, ...]}，每个输入编号都必须出现，不要输出其它内容。

硬性约束（违反会被拒绝）：
- 形如 ⟦B1⟧ 的占位符代表代码块，必须原样保留、各出现恰好一次、不得增删。
- 保持 markdown 形状：标题的 # 个数、列表的标记（- 或 1.）与任务框（- [ ] / - [x]）、表格行的
  竖线数量与列数、引用的 >、整段加粗的段外层的 **。段内不要引入空行。
- 行内代码（反引号内）、链接目标、URL、issue 引用（clangd#1455）、文件路径、命令行、编译器
  诊断原文一律原样保留。
- YAML 段（--- 围栏包住的）只改键名为 ${[...YAML_PROSE_KEYS].join("、")} 的字符串值；其余值
  （layout、theme、icon、link、src 等）连同键名、结构、围栏一律不动。
- 不增删信息：中文说英文说的事，不多不少。

通用规则：
- 翻译：页面与章节标题、表头与表格文字、列表项、描述。
- 有通行中文译名的概念翻译；一页中首次出现且英文更利于检索时，用全角括号附英文，
  如 结构化绑定（structured bindings）。
- 保留英文：产品与工具名、缩写、代码字体里的一切、中文开发者习惯不译的词。拿不准时保留英文并加
  简短中文说明，不要自造译法。
- 同一批里同一术语只用一种译法；同名的表格行与标题总在同一批里，两处中文必须完全一致。
- 标题：散文标题翻译；本身是标识符的标题原样保留（配置节名、请求名、命令行）；混合标题只翻散文
  部分，行内代码原样。
- 代码块里的注释也是代码的一部分，绝不翻译。
- 任务列表项翻正文，保留 [ ] / [x]。

文风：中文句子用全角标点；中英文之间留一个空格；不要机器翻译腔（英文语序、"这个"当冠词、
被动堆叠）；说清楚意思，不必逐词对应。`;

/// The glossary is a markdown file; a frontmatter block (a skill's
/// header) is not part of its rules.
function readGlossary(file: string): string {
    return fs
        .readFileSync(file, "utf8")
        .replace(/^---\n[\s\S]*?\n---\n/, "")
        .trim();
}

function promptFor(glossary: string | null): string {
    if (glossary === null) {
        return REVIEW_PROMPT;
    }
    return (
        `${REVIEW_PROMPT}\n\n本项目的规则与术语表（与上面的通用规则一起遵守，冲突时以此为准）：\n\n` +
        readGlossary(glossary)
    );
}

interface ReviewItem {
    i: number;
    shape: string;
    en: string;
    zh: string;
}

type Backend = (payload: string, expected: number[]) => Promise<Map<number, string>>;

/// Runs one codex invocation; the transcript on stdout is dropped, stderr
/// travels with a failure. No stdin: codex would otherwise wait on it for
/// extra input and never start.
function runCodex(args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn("codex", args, { cwd, stdio: ["ignore", "ignore", "pipe"] });
        let stderr = "";
        child.stderr.on("data", (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`codex exited with ${code}: ${stderr.slice(-400)}`));
            }
        });
    });
}

/// The segments are contributor-written text, so the model gets no tool
/// at all: the codex sandbox only stops writes, a shell tool could still
/// read any host file or the environment and hand it to the model. With
/// the shell, exec, subagent, app, image and web-search surfaces off and
/// no MCP servers, the reply the CLI writes through `-o` is the only
/// channel back; the read-only sandbox and the empty scratch directory
/// stay as a second wall.
const CODEX_NO_TOOLS = [
    "--disable",
    "shell_tool",
    "--disable",
    "unified_exec",
    "--disable",
    "multi_agent",
    "--disable",
    "apps",
    "-c",
    "tools.view_image=false",
    "-c",
    'web_search="disabled"',
    "-c",
    "mcp_servers={}",
    "--sandbox",
    "read-only",
];

/// One codex call per chunk.
function codexBackend(prompt: string, effort: string, fast: boolean): Backend {
    return async (payload, expected) => {
        const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "docs-translation-review-"));
        const reply = path.join(scratch, "reply.md");
        try {
            let lastError: unknown = null;
            for (let attempt = 0; attempt < 2; attempt += 1) {
                await runCodex(
                    [
                        "exec",
                        "--skip-git-repo-check",
                        "-m",
                        "gpt-6-astra",
                        "-c",
                        `model_reasoning_effort=${effort}`,
                        ...(fast ? ["-c", "service_tier=fast"] : []),
                        ...CODEX_NO_TOOLS,
                        "-o",
                        reply,
                        `${prompt}\n\n输入：\n${payload}`,
                    ],
                    scratch,
                );
                try {
                    return parseSegmentsJson(fs.readFileSync(reply, "utf8"), expected);
                } catch (error) {
                    lastError = error;
                    console.error(`  codex reply unusable, retrying: ${String(error)}`);
                }
            }
            throw lastError instanceof Error ? lastError : new Error(String(lastError));
        } finally {
            fs.rmSync(scratch, { recursive: true, force: true });
        }
    };
}

/// The page's translatable segments paired with their current Chinese,
/// code masked on both sides; chunks are what a backend call reviews.
function reviewChunks(
    layout: Layout,
    page: string,
): {
    items: Map<number, ReviewItem>;
    chunks: number[][];
    enSegments: Segment[];
    zhSource: string;
    zhSegments: Segment[];
    enTexts: string[];
    masks: Map<number, string[]>;
} | null {
    const enSource = fs.readFileSync(path.join(layout.en, page), "utf8");
    const zhFile = path.join(layout.zh, page);
    if (!fs.existsSync(zhFile)) {
        console.error(`${page}: no zh counterpart to review`);
        return null;
    }
    const zhSource = fs.readFileSync(zhFile, "utf8");
    const comparison = compareTrees(
        analyzeSource(enSource, page),
        analyzeSource(zhSource, `zh/${page}`),
    );
    if (comparison.structureProblem !== null) {
        console.error(`${page}: not isomorphic, skipped — ${comparison.structureProblem}`);
        return null;
    }
    const enSegments = splitSegments(enSource, page);
    const zhSegments = splitSegments(zhSource, `zh/${page}`);
    const enTexts = enSegments.map((segment) => enSource.slice(segment.start, segment.end));
    const items = new Map<number, ReviewItem>();
    const masks = new Map<number, string[]>();
    enSegments.forEach((segment, i) => {
        if (!segment.translatable) {
            return;
        }
        const zhSegment = at(zhSegments, i);
        const en = maskCode(at(enTexts, i), segment);
        const zh = maskCode(zhSource.slice(zhSegment.start, zhSegment.end), zhSegment);
        masks.set(i, en.blocks);
        items.set(i, { i, shape: segment.shape, en: en.masked, zh: zh.masked });
    });
    const chunks = chunkSegments(
        [...items.keys()],
        pairedLabels(enSegments),
        (i) => mustGet(items, i).en.length + mustGet(items, i).zh.length,
        6000,
    );
    return { items, chunks, enSegments, zhSource, zhSegments, enTexts, masks };
}

/// Segments whose final text is the English copy — byte-identical or
/// merely rewrapped — except the pairs the mapping attests with one hash
/// on both sides: those were reviewed as verbatim on purpose, and
/// `record` is how a new one gets attested.
function englishCopies(
    layout: Layout,
    page: string,
    finalTexts: Map<number, string>,
    enTexts: string[],
): number[] {
    const attested = new Set(
        (loadMapping(layout, page)?.pairs ?? [])
            .filter((pair) => pair.en === pair.zh)
            .map((pair) => pair.en),
    );
    const reflowed = (text: string) => text.replace(/\s+/g, " ").trim();
    return [...finalTexts]
        .filter(
            ([i, text]) =>
                reflowed(text) === reflowed(at(enTexts, i)) && !attested.has(hashSegment(text)),
        )
        .map(([i]) => i);
}

export async function review(
    layout: Layout,
    pages: string[],
    options: ReviewOptions,
): Promise<number> {
    const backend = codexBackend(promptFor(options.glossary), options.effort, options.fast);
    const limit = pLimit(options.jobs);
    const requested = [...new Set(options.pages)];
    const unknown = requested.filter((page) => !pages.includes(page));
    if (unknown.length > 0) {
        console.error(`not a translatable page under ${layout.en}: ${unknown.join(", ")}`);
        return 2;
    }
    const targets = requested.length > 0 ? requested : pages;

    let failed = 0;
    const work = targets.map(async (page) => {
        const plan = reviewChunks(layout, page);
        if (plan === null) {
            failed += 1;
            return;
        }
        const { items, chunks, enSegments, zhSource, zhSegments, enTexts, masks } = plan;
        const replies = await Promise.all(
            chunks.map((chunk) =>
                limit(async () => {
                    const payload = JSON.stringify({
                        segments: chunk.map((i) => mustGet(items, i)),
                    });
                    return backend(payload, chunk);
                }),
            ),
        );
        const reviewed = new Map<number, string>();
        for (const reply of replies) {
            for (const [i, text] of reply) {
                reviewed.set(i, text);
            }
        }
        const currentText = (i: number) =>
            zhSource.slice(at(zhSegments, i).start, at(zhSegments, i).end);
        const finalTexts = new Map<number, string>();
        let kept = 0;
        const keep = (i: number) => {
            finalTexts.set(i, currentText(i));
            kept += 1;
        };
        for (const item of items.values()) {
            const blocks = mustGet(masks, item.i);
            const restored = restoreCode(mustGet(reviewed, item.i), blocks);
            const problem =
                "problem" in restored
                    ? restored.problem
                    : validateSegment(
                          at(enSegments, item.i),
                          at(enTexts, item.i),
                          restored.text,
                          blocks,
                      );
            if ("problem" in restored || problem !== null) {
                console.error(`  ${page} segment ${item.i + 1} (${item.shape}): ${problem} — kept`);
                keep(item.i);
                continue;
            }
            finalTexts.set(item.i, restored.text);
        }
        for (const [row, heading] of pairedLabels(enSegments)) {
            const rowLabel = labelOf(at(enSegments, row), mustGet(finalTexts, row));
            if (rowLabel === labelOf(at(enSegments, heading), mustGet(finalTexts, heading))) {
                continue;
            }
            console.error(
                `  ${page} segments ${row + 1} and ${heading + 1}: table row and heading ` +
                    `share one name in en but came back different — kept`,
            );
            for (const i of [row, heading]) {
                if (mustGet(finalTexts, i) !== currentText(i)) {
                    keep(i);
                }
            }
        }
        const changed = [...finalTexts].filter(([i, text]) => text !== currentText(i)).length;
        let out = "";
        let cursor = 0;
        zhSegments.forEach((segment, i) => {
            out += zhSource.slice(cursor, segment.start);
            out += finalTexts.has(i)
                ? mustGet(finalTexts, i)
                : zhSource.slice(segment.start, segment.end);
            cursor = segment.end;
        });
        out += zhSource.slice(cursor);
        const enSource = fs.readFileSync(path.join(layout.en, page), "utf8");
        const comparison = compareTrees(
            analyzeSource(enSource, page),
            analyzeSource(out, `zh/${page}`),
        );
        if (comparison.structureProblem !== null) {
            throw new Error(
                `${page}: reviewed page is not isomorphic — ${comparison.structureProblem}`,
            );
        }
        for (const [left, right] of comparison.verbatimDiffs) {
            throw new Error(`${page}: ${verbatimLabel(left, right)} corrupted`);
        }
        for (const diff of comparison.labelDiffs) {
            throw new Error(`${page}: ${labelProblem(diff)}`);
        }
        for (const diff of comparison.literalDiffs) {
            throw new Error(`${page}: ${literalProblem(diff)}`);
        }
        fs.writeFileSync(path.join(layout.zh, page), out);
        console.log(
            `done ${page}: ${items.size} segments, ${changed} changed, ${kept} kept on problems`,
        );
        // An English copy — kept on a problem or echoed back by the model —
        // is a draft that `record` would bless untranslated; the page is
        // written anyway so the segments that did translate survive a rerun.
        const untranslated = englishCopies(layout, page, finalTexts, enTexts);
        for (const i of untranslated) {
            console.error(
                `  ${page} segment ${i + 1} (${mustGet(items, i).shape}): still the English copy`,
            );
        }
        if (untranslated.length > 0) {
            console.error(`FAILED ${page}: ${untranslated.length} segments are still English`);
            failed += 1;
        }
    });
    for (const [i, outcome] of (await Promise.allSettled(work)).entries()) {
        if (outcome.status === "rejected") {
            const reason =
                outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
            console.error(`FAILED ${targets.at(i) ?? "?"}: ${reason}`);
            failed += 1;
        }
    }
    console.log(`finished: ${targets.length - failed} pages ok, ${failed} failed`);
    return failed > 0 ? 1 : 0;
}
