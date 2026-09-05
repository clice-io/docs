import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it/index.js";

/**
 * Status stickers for the generated feature tables.
 *
 * A table cell that holds exactly one status word renders as a badge; a
 * cell of the "N supported · N partial · N unsupported" shape renders as a
 * stacked bar with its counts. The vocabulary is shared by the English and
 * Chinese pages; the cell text is kept as the visible label.
 */

type Tone = "ok" | "warn" | "no" | "note";

const WORDS: Record<string, Tone> = {
    Supported: "ok",
    Implemented: "ok",
    Partial: "warn",
    Unsupported: "no",
    Stub: "no",
    Planned: "note",
    支持: "ok",
    已实现: "ok",
    部分支持: "warn",
    不支持: "no",
    存根: "no",
    计划中: "note",
};

const COUNTS = [
    /^(?:(\d+) supported)?(?: · )?(?:(\d+) partial)?(?: · )?(?:(\d+) unsupported)?$/,
    /^(?:(\d+) 项支持)?(?: · )?(?:(\d+) 项部分支持)?(?: · )?(?:(\d+) 项不支持)?$/,
];

function badge(label: string, tone: Tone): string {
    return `<span class="status-badge ${tone}">${label}</span>`;
}

function bar(text: string): string | null {
    for (const re of COUNTS) {
        const m = re.exec(text);
        if (!m) {
            continue;
        }
        const [ok, warn, no] = [m[1], m[2], m[3]].map((n) => (n === undefined ? 0 : Number(n)));
        if (ok + warn + no === 0) {
            continue;
        }
        const segments = [
            ["ok", ok],
            ["warn", warn],
            ["no", no],
        ] as const;
        const track = segments
            .filter(([, n]) => n > 0)
            .map(([tone, n]) => `<i class="${tone}" style="flex:${n}"></i>`)
            .join("");
        const parts = text.split(" · ");
        const counts = segments
            .filter(([, n]) => n > 0)
            .map(([tone], i) => `<b class="${tone}">${parts[i] ?? ""}</b>`)
            .join("");
        return `<span class="status-bar"><span class="track">${track}</span><span class="counts">${counts}</span></span>`;
    }
    return null;
}

export function statusStickers(md: MarkdownIt): void {
    md.core.ruler.push("clice_status", (state) => {
        const tokens = state.tokens;
        for (let i = 0; i + 1 < tokens.length; i += 1) {
            if (tokens[i]!.type !== "td_open" || tokens[i + 1]!.type !== "inline") {
                continue;
            }
            const inline = tokens[i + 1]!;
            const text = inline.content.trim();
            const tone = WORDS[text];
            const html = tone !== undefined ? badge(text, tone) : bar(text);
            if (html === null) {
                continue;
            }
            const token = new state.Token("html_inline", "", 0) as Token;
            token.content = html;
            inline.children = [token];
        }
    });
}
