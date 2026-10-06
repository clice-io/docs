import * as fs from "node:fs";
import { defineConfig } from "vitepress";
import cjkFriendly from "markdown-it-cjk-friendly";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import { genSidebar } from "./sidebar";
import { statusStickers } from "./status";
import { capabilityCards } from "./capability";
import { mermaidFences } from "./mermaid";

const SITE = "https://docs.clice.io";
const projects = ["clice", "catter", "xclang"];

export default defineConfig({
    title: "clice.io",
    description: "Next generation C++ tooling",
    cleanUrls: true,
    srcExclude: ["README.md", "art/**", "output/**", "sources/**"],
    lastUpdated: true,
    sitemap: { hostname: SITE },
    head: [
        // Browsers cache favicons apart from the page; bump v when the icons change.
        ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png?v=2" }],
        ["link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png?v=2" }],
        ["link", { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48.png?v=2" }],
        ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=2" }],
        ["meta", { property: "og:type", content: "website" }],
        ["meta", { property: "og:site_name", content: "clice.io" }],
        ["meta", { name: "twitter:card", content: "summary_large_image" }],
        ["meta", { name: "theme-color", content: "#4568a7" }],
    ],
    transformPageData(pageData, { siteConfig }) {
        const path = pageData.relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
        const isZh = path === "zh" || path.startsWith("zh/");
        const en = isZh ? path.replace(/^zh\/?/, "") : path;
        const url = (p: string) => `${SITE}/${p}`;
        // The en and zh trees mirror each other file for file, except for
        // projects that publish one language only (xclang has no zh tree):
        // link a translation only when its source page exists.
        const source = pageData.relativePath.replace(/^zh\//, "");
        const hasEn = fs.existsSync(`${siteConfig.srcDir}/en/${source}`);
        const hasZh = fs.existsSync(`${siteConfig.srcDir}/zh/${source}`);
        const title = pageData.frontmatter.title ?? pageData.title;
        const description = pageData.frontmatter.description ?? pageData.description;
        const head = [
            ["meta", { property: "og:title", content: title ? `${title} | clice.io` : "clice.io" }],
            ["meta", { property: "og:url", content: url(isZh ? path : en) }],
            ["meta", { property: "og:image", content: `${SITE}/og.png` }],
            ["meta", { property: "og:image:width", content: "1200" }],
            ["meta", { property: "og:image:height", content: "630" }],
            ["meta", { property: "og:locale", content: isZh ? "zh_CN" : "en_US" }],
            ["link", { rel: "canonical", href: url(isZh ? path : en) }],
        ];
        if (hasEn) {
            head.push(["link", { rel: "alternate", hreflang: "en", href: url(en) }]);
            head.push(["link", { rel: "alternate", hreflang: "x-default", href: url(en) }]);
        }
        if (hasZh) {
            head.push(["link", { rel: "alternate", hreflang: "zh-CN", href: url(en ? `zh/${en}` : "zh") }]);
        }
        if (description) {
            head.push(["meta", { property: "og:description", content: description }]);
        }
        pageData.frontmatter.head = [...(pageData.frontmatter.head ?? []), ...head];
        // Temporary: hide the mascot art on the project home pages until new
        // hero art exists. The pages are synced from the project repos, so the
        // image is dropped here rather than in their frontmatter.
        if (projects.includes(en.split("/")[0]) && pageData.frontmatter.hero) {
            delete pageData.frontmatter.hero.image;
        }
    },
    markdown: {
        config: (md) => {
            md.use(cjkFriendly);
            md.use(footnote);
            md.use(taskLists);
            md.use(statusStickers);
            md.use(capabilityCards);
            md.use(mermaidFences);
            // Override caption only (display text) so repeated refs show [1] not [1:1]; leaves id/href intact.
            md.renderer.rules.footnote_caption = (tokens, idx) =>
                `[${Number(tokens[idx].meta.id + 1)}]`;
        },
    },
    rewrites: {
        "en/:rest*": ":rest*",
    },
    vite: {
        build: {
            // Font subsets load per page by unicode-range; inlined into the
            // stylesheet, every page would download all of them.
            assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
        },
    },
    themeConfig: {
        logo: "/mascot/logo-mark.webp",
        outline: "deep",
        search: {
            provider: "local"
        },
        socialLinks: [
            { icon: "github", link: "https://github.com/clice-io" },
            { icon: "discord", link: "https://discord.gg/UgnwYqXWqT" },
        ],
    },
    locales: {
        root: {
            label: "English",
            lang: "en-US",
            link: "/",
            themeConfig: {
                nav: [
                    { text: "blog", link: "/blog" },
                    { text: "clice", link: "/clice/" },
                    { text: "catter", link: "/catter/" },
                    { text: "xclang", link: "/xclang/" },
                    { text: "kotatsu", link: "https://github.com/clice-io/kotatsu" },
                ],
                sidebar: genSidebar(projects, "en"),
            },
        },
        zh: {
            label: "简体中文",
            lang: "zh-CN",
            link: "/zh",
            themeConfig: {
                nav: [
                    { text: "博客", link: "/zh/blog" },
                    { text: "clice", link: "/zh/clice/" },
                    { text: "catter", link: "/zh/catter/" },
                    { text: "xclang", link: "/xclang/" },
                    { text: "kotatsu", link: "https://github.com/clice-io/kotatsu" },
                ],
                sidebar: genSidebar(projects, "zh"),
            },
        },
    },
});
