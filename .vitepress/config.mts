import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { genSidebar } from "./sidebar";

const projects = ["clice", "catter", "clore"];

export default withMermaid(defineConfig({
    title: "Project Clice",
    description: "新一代 C++ 工具链",
    cleanUrls: true,
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
