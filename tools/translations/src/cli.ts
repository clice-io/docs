#!/usr/bin/env node
/// Keep an en and a zh documentation tree aligned without storing any
/// prose twice. RULES.md states the contract; README.md the usage.

import * as fs from "node:fs";
import { parseArgs } from "node:util";
import { check, listPages, record, report, type Layout } from "./contract.ts";
import { review } from "./review.ts";

const USAGE = `usage: clice-translate <check | report | record | review [page...]> [options]

  --en=DIR        English tree (default docs/en)
  --zh=DIR        Chinese tree (default docs/zh)
  --meta=DIR      hash-pair mappings (default docs/meta/translations)
  --ignore=GLOB   leave matching pages out of the contract; repeatable

review only:
  --glossary=FILE the repository's terms and page conventions (markdown)
  --jobs=N        parallel model calls (default 4)
  --effort=LEVEL  reasoning effort (default xhigh)
  --fast          fast service tier`;

async function main(): Promise<number> {
    let parsed;
    try {
        parsed = parseArgs({
            allowPositionals: true,
            options: {
                en: { type: "string", default: "docs/en" },
                zh: { type: "string", default: "docs/zh" },
                meta: { type: "string", default: "docs/meta/translations" },
                ignore: { type: "string", multiple: true, default: [] },
                glossary: { type: "string" },
                jobs: { type: "string", default: "4" },
                effort: { type: "string", default: "xhigh" },
                fast: { type: "boolean", default: false },
                help: { type: "boolean", short: "h", default: false },
            },
        });
    } catch (error) {
        console.error(`${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`);
        return 2;
    }
    const { values, positionals } = parsed;
    if (values.help) {
        console.log(USAGE);
        return 0;
    }
    const [mode, ...rest] = positionals;
    const layout: Layout = {
        en: values.en,
        zh: values.zh,
        meta: values.meta,
        ignore: values.ignore,
    };
    if (!fs.statSync(layout.en, { throwIfNoEntry: false })?.isDirectory()) {
        console.error(`no English tree at ${layout.en}`);
        return 2;
    }
    const pages = listPages(layout);
    if (mode === "review") {
        const jobs = Number(values.jobs);
        if (!Number.isInteger(jobs) || jobs < 1) {
            console.error(`--jobs must be a positive integer, got ${values.jobs}`);
            return 2;
        }
        if (values.glossary !== undefined && !fs.existsSync(values.glossary)) {
            console.error(`no glossary at ${values.glossary}`);
            return 2;
        }
        return review(layout, pages, {
            pages: rest,
            glossary: values.glossary ?? null,
            jobs,
            effort: values.effort,
            fast: values.fast,
        });
    }
    const modes = new Map([
        ["check", check],
        ["report", report],
        ["record", record],
    ]);
    const run = mode === undefined ? undefined : modes.get(mode);
    if (run === undefined || rest.length > 0) {
        console.error(USAGE);
        return 2;
    }
    return run(layout, pages);
}

process.exit(await main());
