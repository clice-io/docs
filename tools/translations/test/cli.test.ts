import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

const CLI = path.join(import.meta.dirname, "../src/cli.ts");
const FIXTURE = path.join(import.meta.dirname, "fixture");

let root = "";

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "translate-test-"));
    fs.cpSync(FIXTURE, root, { recursive: true });
});

afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
});

interface Run {
    status: number | null;
    stdout: string;
    stderr: string;
}

function run(args: string[], env: Record<string, string> = {}): Run {
    const result = spawnSync(
        process.execPath,
        [CLI, ...args, "--en=en", "--zh=zh", "--meta=meta"],
        { cwd: root, encoding: "utf8", env: { ...process.env, ...env } },
    );
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function file(page: string): string {
    return path.join(root, page);
}

function edit(page: string, from: string, to: string): void {
    const text = fs.readFileSync(file(page), "utf8");
    assert.ok(text.includes(from), `${page} does not contain ${from}`);
    fs.writeFileSync(file(page), text.replace(from, to));
}

function snapshotTree(dir: string): Map<string, string> {
    const out = new Map<string, string>();
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
        if (entry.isFile()) {
            const full = path.join(entry.parentPath, entry.name);
            out.set(path.relative(dir, full), fs.readFileSync(full, "utf8"));
        }
    }
    return out;
}

describe("check", () => {
    test("passes on an attested tree", () => {
        const result = run(["check"]);
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout, "zh matches en (2 pages, 18 attested segment pairs)\n");
    });

    test("flags a drifted English segment", () => {
        edit("en/guide/intro.md", "Fast startup", "Very fast startup");
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(
            result.stderr,
            /guide\/intro\.md: segment 5 \(listItem, en line 11 \/ zh line 11\): English changed since last record/,
        );
    });

    test("flags a drifted Chinese segment", () => {
        edit("zh/index.md", "一个演示项目", "演示项目");
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(
            result.stderr,
            /index\.md: segment 1 \(yaml.*Chinese changed since last record/,
        );
    });

    test("flags an altered code block", () => {
        edit("zh/guide/intro.md", "demo check --all", "demo check --everything");
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /verbatim segment 4 \(code.*must be byte-identical/);
    });

    test("flags altered nested code", () => {
        edit("zh/guide/intro.md", "warning: unused variable", "警告：未使用的变量");
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(
            result.stderr,
            /verbatim block inside segment 18 \(listItem, en line 33 \/ zh line 33\)/,
        );
    });

    test("flags altered inline literals", () => {
        edit("zh/guide/intro.md", "(./rules.md)", "(./rule.md)");
        edit("zh/index.md", "link: ./guide/intro", "link: ./guide/start");
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(
            result.stderr,
            /inline literals differ — dropped link\[0\]: \.\/rules\.md, added link\[0\]: \.\/rule\.md/,
        );
        assert.match(result.stderr, /dropped hero\.actions\[0\]\.link: \.\/guide\/intro/);
    });

    test("flags a diverging layout", () => {
        edit("zh/guide/intro.md", "### 悬停", "## 悬停");
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(
            result.stderr,
            /segment layouts diverge at segment 15: en has heading:3 \(line 27\), zh has heading:2/,
        );
    });

    test("flags a row and heading named apart", () => {
        edit("zh/guide/intro.md", "### 悬停", "### 悬停提示");
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(
            result.stderr,
            /table row \(zh line 22\) and heading \(zh line 27\) are both "Hover" in en but "悬停" and "悬停提示" in zh/,
        );
    });

    test("flags missing and stray files", () => {
        fs.rmSync(file("zh/index.md"));
        fs.writeFileSync(file("zh/guide/extra.md"), "# 额外\n");
        fs.writeFileSync(file("meta/gone.json"), '{ "version": 1, "pairs": [] }\n');
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /^index\.md: Chinese page is missing$/m);
        assert.match(result.stderr, /^zh\/guide\/extra\.md: no English counterpart/m);
        assert.match(result.stderr, /^meta stray gone\.json: no English counterpart/m);
        assert.match(result.stderr, /^3 problems$/m);
    });

    test("flags an unrecorded page", () => {
        fs.rmSync(file("meta/index.json"));
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /^index\.md: not recorded/m);
    });
});

describe("ignore", () => {
    beforeEach(() => {
        fs.mkdirSync(file("en/reference"));
        fs.writeFileSync(file("en/reference/api.md"), "# API\n\nGenerated.\n");
    });

    test("an unmatched page joins the contract", () => {
        const result = run(["check"]);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /^reference\/api\.md: Chinese page is missing$/m);
    });

    test("matching pages leave both trees", () => {
        fs.mkdirSync(file("zh/reference"));
        fs.writeFileSync(file("zh/reference/api.md"), "# API\n");
        const result = run(["check", "--ignore=reference/**", "--ignore=other/*.md"]);
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /\(2 pages, 18 attested segment pairs\)/);
    });

    test("record drops an ignored page's mapping", () => {
        fs.mkdirSync(file("meta/reference"));
        fs.writeFileSync(file("meta/reference/api.json"), "{}");
        const result = run(["record", "--ignore=reference/**"]);
        assert.equal(result.status, 0, result.stderr);
        assert.ok(!fs.existsSync(file("meta/reference/api.json")));
    });
});

describe("report", () => {
    test("lists drifted segments with both texts", () => {
        edit("en/guide/intro.md", "Fast startup", "Very fast startup");
        const result = run(["report"]);
        assert.equal(result.status, 0);
        assert.equal(
            result.stdout,
            [
                "guide/intro.md:",
                "  segment 5 (listItem, en line 11 / zh line 11) — " +
                    "English changed since last record — update the Chinese to match",
                "    en | - Very fast startup",
                "    zh | - 启动快",
                "1 pages clean, 0 pages untranslated or unrecorded, 1 drifted segments",
                "",
            ].join("\n"),
        );
    });

    test("pairs shifted segments by content", () => {
        edit("en/guide/intro.md", "- Fast startup\n", "- Fast startup\n- Tiny binary\n");
        edit("zh/guide/intro.md", "- 启动快\n", "- 启动快\n- 二进制小\n");
        const result = run(["report"]);
        assert.equal(result.status, 0);
        assert.match(
            result.stdout,
            /layout changed since last record \(16 pairs recorded, 17 segments now\)/,
        );
        assert.match(result.stdout, /en \| - Tiny binary\n\s+zh \| - 二进制小/);
    });
});

describe("record", () => {
    test("reproduces the committed mappings", () => {
        const committed = snapshotTree(file("meta"));
        fs.rmSync(file("meta"), { recursive: true });
        const result = run(["record"]);
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(snapshotTree(file("meta")), committed);
    });

    test("re-attests a deliberate edit", () => {
        edit("en/guide/intro.md", "Fast startup", "Very fast startup");
        edit("zh/guide/intro.md", "启动快", "启动非常快");
        const recorded = run(["record"]);
        assert.equal(recorded.status, 0, recorded.stderr);
        assert.equal(
            recorded.stdout,
            "guide/intro.md: recorded 16 pairs (1 en-side, 1 zh-side changes)\n",
        );
        assert.equal(run(["check"]).status, 0);
    });

    test("refuses a broken page", () => {
        edit("zh/guide/intro.md", "demo check --all", "demo check --everything");
        const before = snapshotTree(file("meta"));
        const result = run(["record"]);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /must be byte-identical — fix before recording/);
        assert.deepEqual(snapshotTree(file("meta")), before);
    });
});

describe("usage", () => {
    test("rejects an unknown mode", () => {
        assert.equal(run(["translate"]).status, 2);
    });

    test("rejects an unknown option", () => {
        const result = run(["check", "--root=docs"]);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /Unknown option '--root'/);
    });

    test("rejects pages outside review", () => {
        assert.equal(run(["check", "index.md"]).status, 2);
    });

    test("rejects a missing English tree", () => {
        fs.renameSync(file("en"), file("english"));
        const result = run(["check"]);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /^no English tree at en$/m);
    });
});

/// A stand-in for the codex CLI: answers each segment according to
/// FAKE_CODEX_MODE and saves the prompt it was given to FAKE_CODEX_PROMPT.
const FAKE_CODEX = `#!/usr/bin/env node
import * as fs from "node:fs";
const args = process.argv.slice(2);
const prompt = args.at(-1);
const reply = args[args.indexOf("-o") + 1];
fs.writeFileSync(process.env.FAKE_CODEX_PROMPT, prompt);
const input = JSON.parse(prompt.slice(prompt.indexOf("输入：\\n") + 4));
const answer = (segment) => {
    switch (process.env.FAKE_CODEX_MODE) {
        case "echo-en":
            return segment.en;
        case "drop-code":
            return segment.zh.replaceAll("\`", "");
        default:
            return segment.zh.replace("运行它", "运行");
    }
};
const segments = input.segments.map((segment) => ({ i: segment.i, text: answer(segment) }));
fs.writeFileSync(reply, JSON.stringify({ segments }));
`;

describe("review", () => {
    let env: Record<string, string> = {};

    beforeEach(() => {
        const bin = path.join(root, "bin");
        fs.mkdirSync(bin);
        fs.writeFileSync(path.join(bin, "codex"), FAKE_CODEX, { mode: 0o755 });
        env = {
            PATH: `${bin}${path.delimiter}${process.env["PATH"] ?? ""}`,
            FAKE_CODEX_PROMPT: path.join(root, "prompt.txt"),
        };
    });

    test("writes the reviewed Chinese back", () => {
        const result = run(["review", "guide/intro.md"], env);
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /done guide\/intro\.md: 16 segments, 1 changed, 0 kept/);
        assert.match(fs.readFileSync(file("zh/guide/intro.md"), "utf8"), /^2\. 运行$/m);
        const prompt = fs.readFileSync(env["FAKE_CODEX_PROMPT"] ?? "", "utf8");
        assert.doesNotMatch(prompt, /warning: unused variable/);
        assert.match(prompt, /⟦B1⟧/);
    });

    test("keeps a reply that drops literals", () => {
        const before = fs.readFileSync(file("zh/guide/intro.md"), "utf8");
        const result = run(["review", "guide/intro.md"], { ...env, FAKE_CODEX_MODE: "drop-code" });
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stderr, /inline literals changed: dropped `demo check` — kept/);
        assert.equal(fs.readFileSync(file("zh/guide/intro.md"), "utf8"), before);
    });

    test("fails a page left in English", () => {
        fs.copyFileSync(file("en/index.md"), file("zh/index.md"));
        const result = run(["review", "index.md"], { ...env, FAKE_CODEX_MODE: "echo-en" });
        assert.equal(result.status, 1);
        assert.match(result.stderr, /FAILED index\.md: 2 segments are still English/);
    });

    test("appends the glossary", () => {
        fs.writeFileSync(file("glossary.md"), "---\nname: terms\n---\n\n- parser → 解析器\n");
        const result = run(["review", "index.md", "--glossary=glossary.md"], env);
        assert.equal(result.status, 0, result.stderr);
        const prompt = fs.readFileSync(env["FAKE_CODEX_PROMPT"] ?? "", "utf8");
        assert.match(prompt, /本项目的规则与术语表[^\n]*\n\n- parser → 解析器\n\n输入：/);
        assert.doesNotMatch(prompt, /name: terms/);
    });

    test("strips CRLF frontmatter", () => {
        fs.writeFileSync(file("glossary.md"), "---\r\nname: terms\r\n---\r\n\r\n- parser\r\n");
        const result = run(["review", "index.md", "--glossary=glossary.md"], env);
        assert.equal(result.status, 0, result.stderr);
        assert.doesNotMatch(fs.readFileSync(env["FAKE_CODEX_PROMPT"] ?? "", "utf8"), /name: terms/);
    });

    test("rejects a missing glossary", () => {
        const result = run(["review", "index.md", "--glossary=nope.md"], env);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /^no glossary at nope\.md$/m);
    });

    test("rejects an unknown page", () => {
        const result = run(["review", "missing.md"], env);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /not a translatable page under en: missing\.md/);
    });
});
