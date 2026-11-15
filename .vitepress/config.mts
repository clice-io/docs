import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfigWithTheme, type DefaultTheme } from "vitepress";
import cjkFriendly from "markdown-it-cjk-friendly";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import { genSidebar } from "./sidebar";
import { statusStickers } from "./status";
import { capabilityCards } from "./capability";
import { mermaidFences } from "./mermaid";
import { literalBraces } from "./braces";
import { pairedAnchors } from "./anchors";
import { excerptOf } from "./excerpt";

const SITE = "https://docs.clice.io";
const projects = ["clice", "catter", "xclang"];

// The projects that publish a zh tree. The other projects are English only:
// their zh nav and footer entries link to the English pages. A sync that adds
// zh/<project> switches the project over at the next build. The trees sit
// next to .vitepress: srcDir is not set, so it is the site root.
const zhProjects = projects.filter((p) => fs.existsSync(new URL(`../zh/${p}`, import.meta.url)));

/** A project's pages in a language: zh, if the project publishes zh. */
function projectBase(p: string, lang: "en" | "zh"): string {
    return lang === "zh" && zhProjects.includes(p) ? `/zh/${p}` : `/${p}`;
}

// A project opens on its "What is" page: its home page only redirects
// there (see transformPageData and the theme's setup).
function projectNav(lang: "en" | "zh"): DefaultTheme.NavItem[] {
    return projects.map((p) => ({
        text: p,
        link: `${projectBase(p, lang)}/guide/what-is-${p}`,
        activeMatch: `^${projectBase(p, lang)}/`,
    }));
}

export default defineConfigWithTheme<DefaultTheme.Config & { zhProjects?: string[] }>({
    title: "clice.io",
    description: "Next generation C++ tooling",
    cleanUrls: true,
    srcExclude: ["README.md", "art/**", "output/**", "sources/**", "tools/**", "check-translations/**"],
    lastUpdated: true,
    sitemap: {
        hostname: SITE,
        // A project's home only redirects to its "What is" page.
        transformItems: (items) =>
            items.filter((item) => !new RegExp(`^/?(zh/)?(${projects.join("|")})/?$`).test(item.url)),
    },
    head: [
        // Browsers cache favicons apart from the page; bump v when the icons change.
        ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png?v=2" }],
        ["link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png?v=2" }],
        ["link", { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48.png?v=2" }],
        ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=2" }],
        ["meta", { property: "og:type", content: "website" }],
        ["meta", { property: "og:site_name", content: "clice.io" }],
        ["meta", { name: "theme-color", content: "#4568a7" }],
    ],
    transformPageData(pageData, { siteConfig }) {
        const path = pageData.relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
        const isZh = path === "zh" || path.startsWith("zh/");
        const en = isZh ? path.replace(/^zh\/?/, "") : path;
        const url = (p: string) => `${SITE}/${p}`;
        // The en and zh trees mirror each other file for file, except for
        // projects that publish English only (no zh/<project> tree, see
        // zhProjects): link a translation only when its source page exists.
        const source = pageData.relativePath.replace(/^zh\//, "");
        const hasEn = fs.existsSync(`${siteConfig.srcDir}/en/${source}`);
        const hasZh = fs.existsSync(`${siteConfig.srcDir}/zh/${source}`);
        // A project home has no heading: its hero names it.
        const title = pageData.frontmatter.title ?? (pageData.title || pageData.frontmatter.hero?.name);
        // A page without a description of its own previews with its hero or
        // first paragraph (see excerpt.ts), not the site's tagline.
        const description =
            pageData.frontmatter.description ?? (excerptOf(`${siteConfig.srcDir}/${pageData.filePath}`) || pageData.description);
        if (description) pageData.description = description;
        // A project's home page goes straight to its "What is" page: GitHub
        // Pages has no redirects, so the page refreshes to it before showing
        // anything (the theme redirects navigation within the site).
        const home = projects.find((p) => en.replace(/\/$/, "") === p);
        const target = home ? `${isZh ? "/zh" : ""}/${home}/guide/what-is-${home}` : "";
        const head = [
            ["meta", { property: "og:title", content: title && title !== "clice.io" ? `${title} | clice.io` : "clice.io" }],
            ["meta", { property: "og:url", content: url(isZh ? path : en) }],
            ["meta", { property: "og:locale", content: isZh ? "zh_CN" : "en_US" }],
            ["link", { rel: "canonical", href: target ? `${SITE}${target}` : url(isZh ? path : en) }],
            // No share image: a link preview shows the page's title and description.
            ["meta", { name: "twitter:card", content: "summary" }],
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
        if (target) {
            head.push(["meta", { "http-equiv": "refresh", content: `0; url=${target}` }]);
            // Nothing of the synced home (hero, feature cards) shows meanwhile.
            pageData.frontmatter = { layout: "page", search: false, sidebar: false, aside: false };
        }
        pageData.frontmatter.head = [...(pageData.frontmatter.head ?? []), ...head];
    },
    markdown: {
        config: (md) => {
            md.use(cjkFriendly);
            md.use(footnote);
            md.use(taskLists);
            md.use(statusStickers);
            md.use(capabilityCards);
            md.use(mermaidFences);
            md.use(pairedAnchors, fileURLToPath(new URL("..", import.meta.url)));
            // Last, so it wraps whatever text and inline code renderers are in place.
            md.use(literalBraces);
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
        // Read by SiteFooter, which runs in the browser.
        zhProjects,
        outline: "deep",
        search: {
            provider: "local",
            options: {
                locales: {
                    zh: {
                        translations: {
                            button: { buttonText: "搜索", buttonAriaLabel: "搜索" },
                            modal: {
                                displayDetails: "显示详细列表",
                                resetButtonTitle: "清除查询",
                                backButtonTitle: "关闭搜索",
                                noResultsText: "没有找到结果",
                                footer: {
                                    selectText: "选择",
                                    selectKeyAriaLabel: "回车",
                                    navigateText: "切换",
                                    navigateUpKeyAriaLabel: "上方向键",
                                    navigateDownKeyAriaLabel: "下方向键",
                                    closeText: "关闭",
                                    closeKeyAriaLabel: "Esc",
                                },
                            },
                        },
                    },
                },
            },
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
                // The projects, then the blog.
                nav: [
                    ...projectNav("en"),
                    { text: "kotatsu", link: "https://github.com/clice-io/kotatsu" },
                    { text: "blog", link: "/blog" },
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
                    ...projectNav("zh"),
                    { text: "kotatsu", link: "https://github.com/clice-io/kotatsu" },
                    { text: "blog", link: "/zh/blog" },
                ],
                sidebar: genSidebar(projects, "zh"),
                // VitePress's own words, which it otherwise shows in English.
                outline: { level: "deep", label: "本页目录" },
                docFooter: { prev: "上一页", next: "下一页" },
                lastUpdated: { text: "最后更新于" },
                darkModeSwitchLabel: "外观",
                lightModeSwitchTitle: "切换到浅色模式",
                darkModeSwitchTitle: "切换到深色模式",
                sidebarMenuLabel: "菜单",
                returnToTopLabel: "回到顶部",
                langMenuLabel: "切换语言",
                skipToContentLabel: "跳到正文",
                notFound: {
                    title: "页面不存在",
                    quote: "这里什么也没有。也许它搬走了，也许链接写错了。",
                    linkLabel: "回到首页",
                    linkText: "回到首页",
                },
            },
        },
    },
});
