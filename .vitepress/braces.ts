import type MarkdownIt from "markdown-it";

/**
 * Literal `{{` in text and inline code.
 *
 * VitePress compiles every page as a Vue template, but the pages synced
 * from the project repos are written for GitHub, where `{{` is just text.
 * Vue reads it as the start of an interpolation: `{{ x }}` renders the
 * value of `x`, and a lone `{{` fails the build ("Interpolation end sign
 * was not found"). VitePress marks fenced blocks `v-pre`, but not inline
 * code or text.
 *
 * Here the text and inline code renderers write each `{` that starts a
 * `{{` as `&#123;`, and a `{` that ends their output too: the next text
 * token may begin with one (a capability card drops the `**` around its
 * title, which can leave `{` and `{` side by side). Vue looks for the
 * delimiter in the raw template, so the entity cannot open an
 * interpolation, and it decodes the entity into the text node: the page
 * shows the braces as written. The HTML that never meets Vue's compiler
 * (the example cards' v-html, the local search index) decodes it the same
 * way. Raw HTML in the markdown is left as is.
 */
export function escapeBraces(html: string): string {
    return html.replaceAll(/\{(?=\{|$)/g, "&#123;");
}

export function literalBraces(md: MarkdownIt): void {
    for (const rule of ["text", "code_inline"] as const) {
        const render = md.renderer.rules[rule]!;
        md.renderer.rules[rule] = (tokens, idx, options, env, self) =>
            escapeBraces(render(tokens, idx, options, env, self));
    }
}
