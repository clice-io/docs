import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// Renders GitHub issue/PR links the way GitHub itself does: the icon leads, the
// link collapses to the `owner/repo#number` shorthand, and hovering shows a
// card with the issue/PR title + state. Title and state are resolved at build
// time and cached in github-links.json, so the published site is a static
// snapshot — no client-side API calls.

export type RefInfo = {
    type: "issue" | "pull";
    state: "open" | "closed" | "merged";
    reason: string | null;
    title: string;
};

export type GithubState = Map<string, RefInfo>;

// https://github.com/{owner}/{repo}/{issues|pull}/{number}
const HREF_RE = /^https?:\/\/github\.com\/([^/#?]+)\/([^/#?]+)\/(issues|pull)\/(\d+)(?:[/#?].*)?$/i;
const SCAN_RE = /https?:\/\/github\.com\/([^/#?\s)]+)\/([^/#?\s)]+)\/(issues|pull)\/(\d+)/gi;

function keyFor(owner: string, repo: string, type: string, number: string): string {
    return `${owner}/${repo}/${type}/${number}`;
}

function seedPathFor(rootDir: string): string {
    return join(rootDir, ".vitepress", "github-links.json");
}

function scanMarkdown(dir: string, out: Set<string>): void {
    for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name.startsWith(".")) continue;
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) {
            scanMarkdown(full, out);
        } else if (extname(name) === ".md") {
            for (const m of readFileSync(full, "utf8").matchAll(SCAN_RE)) {
                out.add(keyFor(m[1], m[2], m[3], m[4]));
            }
        }
    }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const out: R[] = [];
    let i = 0;
    const run = async () => {
        while (i < items.length) {
            const idx = i++;
            out[idx] = await fn(items[idx]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
    return out;
}

async function fetchState(key: string): Promise<RefInfo | null> {
    const [owner, repo, type, number] = key.split("/");
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "clice-docs-build",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const base = `https://api.github.com/repos/${owner}/${repo}`;
    try {
        if (type === "pull") {
            const res = await fetch(`${base}/pulls/${number}`, { headers });
            if (!res.ok) return null;
            const j: any = await res.json();
            return { type: "pull", state: j.merged ? "merged" : j.state, reason: null, title: j.title };
        }
        const res = await fetch(`${base}/issues/${number}`, { headers });
        if (!res.ok) return null;
        const j: any = await res.json();
        return {
            type: j.pull_request ? "pull" : "issue",
            state: j.state,
            reason: j.state_reason ?? null,
            title: j.title,
        };
    } catch {
        return null;
    }
}

function differs(a: RefInfo | undefined, b: RefInfo): boolean {
    return !a || a.type !== b.type || a.state !== b.state || a.reason !== b.reason || a.title !== b.title;
}

// Loads cached states from github-links.json. When a GitHub token is available
// (CI) or DOCS_REFRESH_GH=1 is set, it also refreshes live and rewrites the
// cache. Without a token it stays fully offline using the committed cache,
// keeping local dev builds deterministic and free of API rate limits.
export async function loadGithubState(rootDir: string): Promise<GithubState> {
    const seedPath = seedPathFor(rootDir);
    const map: GithubState = new Map();
    if (existsSync(seedPath)) {
        try {
            const seed = JSON.parse(readFileSync(seedPath, "utf8")) as Record<string, RefInfo>;
            for (const [k, v] of Object.entries(seed)) map.set(k, v);
        } catch {
            /* corrupt cache — fall through with empty/partial map */
        }
    }

    const refresh = process.env.DOCS_REFRESH_GH === "1" || !!process.env.GITHUB_TOKEN || !!process.env.GH_TOKEN;
    if (refresh) {
        const urls = new Set<string>();
        try {
            scanMarkdown(rootDir, urls);
        } catch {
            /* ignore scan errors, refresh only what we already know */
        }
        for (const k of map.keys()) urls.add(k);

        const keys = [...urls];
        const results = await pool(keys, 6, async (key) => [key, await fetchState(key)] as const);
        let changed = false;
        for (const [key, info] of results) {
            if (info && differs(map.get(key), info)) {
                map.set(key, info);
                changed = true;
            }
        }
        if (changed) {
            const obj = Object.fromEntries([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
            try {
                writeFileSync(seedPath, JSON.stringify(obj, null, 2) + "\n");
            } catch {
                /* read-only fs — in-memory map is still used for this build */
            }
        }
    }

    return map;
}

function cssState(info: RefInfo): string {
    if (info.type === "pull") {
        if (info.state === "merged") return "merged";
        if (info.state === "closed") return "closed-pr";
        return "open";
    }
    if (info.state === "closed") return info.reason === "not_planned" ? "not-planned" : "completed";
    return "open";
}

const PATHS: Record<string, string> = {
    open:
        '<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>' +
        '<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>',
    completed:
        '<path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path>' +
        '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path>',
    "not-planned":
        '<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 0 0 10.535 5.096L2.904 3.965A6.47 6.47 0 0 0 1.5 8Zm12.96 0a6.47 6.47 0 0 0-1.404-4.035L4.965 13.096A6.5 6.5 0 0 0 14.46 8Z"></path>',
    merged:
        '<path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"></path>',
    "open-pr":
        '<path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path>',
    "closed-pr":
        '<path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm0 11a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0-9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path>' +
        '<path d="M13.405 1.72a.75.75 0 0 1 0 1.06L12.185 4l1.22 1.22a.75.75 0 0 1-1.06 1.06l-1.22-1.22-1.22 1.22a.75.75 0 1 1-1.06-1.06L10.065 4l-1.22-1.22a.75.75 0 0 1 1.06-1.06l1.22 1.22 1.22-1.22a.75.75 0 0 1 1.06 0ZM11.5 9.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm0 1.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path>',
};

function svgFor(info: RefInfo): string {
    const state = cssState(info);
    const glyph = info.type === "pull" && state === "open" ? "open-pr" : state;
    const path = PATHS[glyph] ?? PATHS.open;
    return `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">${path}</svg>`;
}

// GitHub issue/PR titles arrive as plain text, but they commonly contain
// `backtick` code spans. GitHub itself shows the raw backticks; we do a touch
// better by rendering those spans as inline <code>, while escaping everything
// else. We deliberately handle only code spans — running a full markdown pass
// could emit a nested <a> inside our link.
function renderTitle(esc: (s: string) => string, title: string): string {
    let out = "";
    let last = 0;
    for (const m of title.matchAll(/`([^`]+)`/g)) {
        out += esc(title.slice(last, m.index)) + `<code>${esc(m[1])}</code>`;
        last = m.index + m[0].length;
    }
    return out + esc(title.slice(last));
}

// markdown-it plugin: tags GitHub issue/PR links with a state class and leads
// with the state icon. Bare/auto-linked URLs are rendered the way GitHub renders
// a pasted reference — `[icon] Title owner/repo#number`, all inline. Explicit
// links keep the author's text and only gain the leading state icon.
export function githubLinksPlugin(md: any, state: GithubState): void {
    const esc = md.utils.escapeHtml;
    const defaultOpen =
        md.renderer.rules.link_open ||
        ((tokens: any, idx: number, options: any, _env: any, self: any) =>
            self.renderToken(tokens, idx, options));

    md.renderer.rules.link_open = (tokens: any, idx: number, options: any, env: any, self: any) => {
        const token = tokens[idx];
        const href: string = token.attrGet("href") || "";
        const m = href.match(HREF_RE);
        if (!m) return defaultOpen(tokens, idx, options, env, self);

        const [, owner, repo, type, number] = m;
        const info = state.get(keyFor(owner, repo, type, number));
        token.attrJoin("class", info ? `gh-ref gh-${cssState(info)}` : "gh-ref");

        const opened = defaultOpen(tokens, idx, options, env, self);
        if (!info) return opened;

        const icon = `<span class="gh-icon">${svgFor(info)}</span>`;
        const ref = `${owner}/${repo}#${number}`;

        // Bare/auto-linked URL: render the title and reference inline, GitHub-style.
        const isAuto = token.markup === "linkify" || token.markup === "autolink";
        const next = tokens[idx + 1];
        if (isAuto && next && next.type === "text") {
            next.content = "";
            return `${opened}${icon}<span class="gh-title">${renderTitle(esc, info.title)}</span> <span class="gh-num">${esc(ref)}</span>`;
        }

        // Explicit link with author-chosen text: just lead with the state icon.
        return opened + icon;
    };
}
