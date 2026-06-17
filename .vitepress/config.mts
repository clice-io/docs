import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { genSidebar } from "./sidebar";
import { loadGithubState, githubLinksPlugin } from "./github-links";

const projects = ["clice", "catter", "clore"];

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const githubState = await loadGithubState(rootDir);

export default withMermaid(defineConfig({
    title: "Project Clice",
    description: "新一代 C++ 工具链",
    cleanUrls: true,
    markdown: {
        config: (md) => {
            md.use(footnote);
            md.use(taskLists);
            githubLinksPlugin(md, githubState);
            // Override caption only (display text) so repeated refs show [1] not [1:1]; leaves id/href intact.
            md.renderer.rules.footnote_caption = (tokens, idx) =>
                `[${Number(tokens[idx].meta.id + 1)}]`;
        },
    },
    rewrites: {
        "en/:rest*": ":rest*",
    },
    themeConfig: {
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
                    { text: "Blog", link: "/blog/" },
                    { text: "clice", link: "/clice/" },
                    { text: "catter", link: "/catter/" },
                    { text: "clore", link: "/clore/" },
                    { text: "cxx-toolchains", link: "https://github.com/clice-io/cxx-toolchains" },
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
                    { text: "clore", link: "/zh/clore/" },
                    { text: "cxx-toolchains", link: "https://github.com/clice-io/cxx-toolchains" },
                ],
                sidebar: genSidebar(projects, "zh"),
            },
        },
    },
}));
