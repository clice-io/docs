import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import { genSidebar } from "./sidebar";
import { statusStickers } from "./status";

const projects = ["clice", "catter"];

export default withMermaid(defineConfig({
    title: "Project Clice",
    description: "Next generation C++ tooling",
    cleanUrls: true,
    markdown: {
        config: (md) => {
            md.use(footnote);
            md.use(taskLists);
            md.use(statusStickers);
            // Override caption only (display text) so repeated refs show [1] not [1:1]; leaves id/href intact.
            md.renderer.rules.footnote_caption = (tokens, idx) =>
                `[${Number(tokens[idx].meta.id + 1)}]`;
        },
    },
    rewrites: {
        "en/:rest*": ":rest*",
    },
    themeConfig: {
        logo: "/mascot/logo.png",
        outline: "deep",
        search: {
            provider: "local"
        },
        socialLinks: [
            { icon: "github", link: "https://github.com/clice-io" },
            { icon: "discord", link: "https://discord.gg/UgnwYqXWqT" },
        ],
        footer: {
            copyright: "Copyright © 2024-2026"
        }
    },
    locales: {
        root: {
            label: "English",
            lang: "en-US",
            link: "/",
            themeConfig: {
                nav: [
                    { text: "blog", link: "/blog/" },
                    { text: "clice", link: "/clice/" },
                    { text: "catter", link: "/catter/" },
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
                    { text: "博客", link: "/zh/blog/" },
                    { text: "clice", link: "/zh/clice/" },
                    { text: "catter", link: "/zh/catter/" },
                    { text: "kotatsu", link: "https://github.com/clice-io/kotatsu" },
                ],
                sidebar: genSidebar(projects, "zh"),
            },
        },
    },
}));
