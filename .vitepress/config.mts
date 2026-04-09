import { defineConfig } from "vitepress";

export default defineConfig({
    title: "Project Clice",
    description: "新一代 C++ 工具链",
    cleanUrls: true,
    rewrites: {
        "en/:rest*": ":rest*",
    },
    themeConfig: {
        socialLinks: [{ icon: "github", link: "https://github.com/clice-io" }],
        outline: "deep",
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
                    { text: "catter", link: "/catter/overview" },
                    { text: "cltas", link: "https://clice-io.github.io/cltas/" },
                ],
                sidebar: {
                    "/clice/": [
                        {
                            text: "Guide",
                            items: [
                                { text: "What is clice", link: "/clice/guide/what-is-clice" },
                                { text: "Quick Start", link: "/clice/guide/quick-start" },
                                { text: "Configuration", link: "/clice/guide/configuration" },
                            ],
                        },
                        {
                            text: "Design",
                            items: [
                                { text: "Index", link: "/clice/design/index" },
                                { text: "Architecture", link: "/clice/design/architecture" },
                                { text: "Compilation", link: "/clice/design/compilation" },
                                { text: "Header Context", link: "/clice/design/header-context" },
                                { text: "Template Resolver", link: "/clice/design/template-resolver" },
                            ],
                        },
                        {
                            text: "Development",
                            items: [
                                { text: "Build", link: "/clice/dev/build" },
                                { text: "Contribution", link: "/clice/dev/contribution" },
                                { text: "Extension", link: "/clice/dev/extension" },
                                { text: "Test and Debug", link: "/clice/dev/test-and-debug" },
                            ],
                        },
                    ],
                    "/catter/": [
                        {
                            text: "Catter",
                            items: [
                                { text: "Overview", link: "/catter/overview" },
                                { text: "API", link: "/catter/api" },
                            ],
                        },
                    ],
                },
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
                    { text: "catter", link: "/zh/catter/overview" },
                    { text: "cltas", link: "https://clice-io.github.io/cltas/" },
                ],
                sidebar: {
                    "/zh/clice/": [
                        {
                            text: "指南",
                            items: [
                                { text: "什么是 clice", link: "/zh/clice/guide/what-is-clice" },
                                { text: "快速开始", link: "/zh/clice/guide/quick-start" },
                                { text: "配置", link: "/zh/clice/guide/configuration" },
                            ],
                        },
                        {
                            text: "设计",
                            items: [
                                { text: "索引", link: "/zh/clice/design/index" },
                                { text: "架构", link: "/zh/clice/design/architecture" },
                                { text: "编译", link: "/zh/clice/design/compilation" },
                                { text: "头文件上下文", link: "/zh/clice/design/header-context" },
                                { text: "模板解析器", link: "/zh/clice/design/template-resolver" },
                            ],
                        },
                        {
                            text: "开发",
                            items: [
                                { text: "构建", link: "/zh/clice/dev/build" },
                                { text: "参与贡献", link: "/zh/clice/dev/contribution" },
                                { text: "扩展", link: "/zh/clice/dev/extension" },
                                { text: "测试与调试", link: "/zh/clice/dev/test-and-debug" },
                            ],
                        },
                    ],
                    "/zh/catter/": [
                        {
                            text: "Catter",
                            items: [
                                { text: "Overview", link: "/zh/catter/overview" },
                                { text: "API", link: "/zh/catter/api" },
                            ],
                        },
                    ],
                },
            },
        },
    },
});
