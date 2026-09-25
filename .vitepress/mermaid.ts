import type MarkdownIt from "markdown-it";

/**
 * Mermaid diagrams: a ```mermaid fence renders as <Mermaid>, which loads the
 * mermaid library on mount. Only a few pages draw a diagram, so the library
 * stays out of the bundle every page loads.
 */
export function mermaidFences(md: MarkdownIt): void {
    const fence = md.renderer.rules.fence!;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]!;
        if (token.info.trim() === "mermaid") {
            return `<Mermaid id="mermaid-${idx}" graph="${encodeURIComponent(token.content)}" />\n`;
        }
        return fence(tokens, idx, options, env, self);
    };
}
