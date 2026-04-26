import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

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
                    "/catter": [
                        {
                            text: "Catter",
                            items: [
                                { text: "Overview", link: "/catter/overview" },
                                { text: "API", link: "/catter/api" },
                            ],
                        },
                    ],
                    "/clore/": [
                        {
                            text: "API Reference",
                            items: [
                                { text: "Overview", link: "/clore/index" },
                            ],
                        },
                        {
                            text: "Modules",
                            collapsed: false,
                            items: [
                                {
                                    text: "agent",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/modules/agent/index" },
                                        { text: "tools", link: "/clore/modules/agent/tools" },
                                    ],
                                },
                                {
                                    text: "anthropic",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/modules/anthropic/index" },
                                        {
                                            text: "functions",
                                            collapsed: true,
                                            items: [
                                                { text: "append-text-with-gap", link: "/clore/modules/anthropic/functions/append-text-with-gap" },
                                                { text: "build-messages-url", link: "/clore/modules/anthropic/functions/build-messages-url" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    text: "client",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/modules/client/index" },
                                        {
                                            text: "functions",
                                            collapsed: true,
                                            items: [
                                                { text: "select-event-loop", link: "/clore/modules/client/functions/select-event-loop" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    text: "config",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/modules/config/index" },
                                        { text: "load", link: "/clore/modules/config/load" },
                                        { text: "normalize", link: "/clore/modules/config/normalize" },
                                        { text: "schema", link: "/clore/modules/config/schema" },
                                        { text: "validate", link: "/clore/modules/config/validate" },
                                    ],
                                },
                                {
                                    text: "extract",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/modules/extract/index" },
                                        { text: "ast", link: "/clore/modules/extract/ast" },
                                        { text: "cache", link: "/clore/modules/extract/cache" },
                                        { text: "compiler", link: "/clore/modules/extract/compiler" },
                                        { text: "filter", link: "/clore/modules/extract/filter" },
                                        {
                                            text: "functions",
                                            collapsed: true,
                                            items: [
                                                { text: "ensure-cache-key-impl", link: "/clore/modules/extract/functions/ensure-cache-key-impl" },
                                                { text: "ensure-cache-key", link: "/clore/modules/extract/functions/ensure-cache-key" },
                                                { text: "normalize-entry-file", link: "/clore/modules/extract/functions/normalize-entry-file" },
                                                { text: "scan-module-decl", link: "/clore/modules/extract/functions/scan-module-decl" },
                                            ],
                                        },
                                        { text: "merge", link: "/clore/modules/extract/merge" },
                                        { text: "model", link: "/clore/modules/extract/model" },
                                        { text: "scan", link: "/clore/modules/extract/scan" },
                                    ],
                                },
                                {
                                    text: "generate",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/modules/generate/index" },
                                        { text: "analysis", link: "/clore/modules/generate/analysis" },
                                        { text: "cache", link: "/clore/modules/generate/cache" },
                                        { text: "common", link: "/clore/modules/generate/common" },
                                        { text: "diagram", link: "/clore/modules/generate/diagram" },
                                        { text: "dryrun", link: "/clore/modules/generate/dryrun" },
                                        { text: "evidence", link: "/clore/modules/generate/evidence" },
                                        {
                                            text: "functions",
                                            collapsed: true,
                                            items: [
                                                { text: "normalize-text-for-hashing", link: "/clore/modules/generate/functions/normalize-text-for-hashing" },
                                            ],
                                        },
                                        { text: "markdown", link: "/clore/modules/generate/markdown" },
                                        { text: "model", link: "/clore/modules/generate/model" },
                                        { text: "page", link: "/clore/modules/generate/page" },
                                        { text: "planner", link: "/clore/modules/generate/planner" },
                                        { text: "scheduler", link: "/clore/modules/generate/scheduler" },
                                        { text: "symbol", link: "/clore/modules/generate/symbol" },
                                    ],
                                },
                                { text: "http", link: "/clore/modules/http/index" },
                                { text: "network", link: "/clore/modules/network/index" },
                                { text: "openai", link: "/clore/modules/openai/index" },
                                {
                                    text: "protocol",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/modules/protocol/index" },
                                        {
                                            text: "functions",
                                            collapsed: true,
                                            items: [
                                                { text: "icontains", link: "/clore/modules/protocol/functions/icontains" },
                                            ],
                                        },
                                    ],
                                },
                                { text: "provider", link: "/clore/modules/provider/index" },
                                { text: "schema", link: "/clore/modules/schema/index" },
                                {
                                    text: "support",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/modules/support/index" },
                                        {
                                            text: "functions",
                                            collapsed: true,
                                            items: [
                                                { text: "ensure-utf8", link: "/clore/modules/support/functions/ensure-utf8" },
                                                { text: "log", link: "/clore/modules/support/functions/log" },
                                                { text: "strip-utf8-bom", link: "/clore/modules/support/functions/strip-utf8-bom" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            text: "Namespaces",
                            collapsed: false,
                            items: [
                                {
                                    text: "clore",
                                    collapsed: true,
                                    items: [
                                        { text: "Overview", link: "/clore/namespaces/clore/index" },
                                        { text: "agent", link: "/clore/namespaces/clore/agent/index" },
                                        { text: "config", link: "/clore/namespaces/clore/config/index" },
                                        {
                                            text: "extract",
                                            collapsed: true,
                                            items: [
                                                { text: "Overview", link: "/clore/namespaces/clore/extract/index" },
                                                {
                                                    text: "cache",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "Overview", link: "/clore/namespaces/clore/extract/cache/index" },
                                                    ],
                                                },
                                                {
                                                    text: "functions",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "ensure-cache-key-impl", link: "/clore/namespaces/clore/extract/functions/ensure-cache-key-impl" },
                                                        { text: "ensure-cache-key", link: "/clore/namespaces/clore/extract/functions/ensure-cache-key" },
                                                        { text: "normalize-entry-file", link: "/clore/namespaces/clore/extract/functions/normalize-entry-file" },
                                                        { text: "scan-module-decl", link: "/clore/namespaces/clore/extract/functions/scan-module-decl" },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            text: "generate",
                                            collapsed: true,
                                            items: [
                                                { text: "Overview", link: "/clore/namespaces/clore/generate/index" },
                                                {
                                                    text: "cache",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "Overview", link: "/clore/namespaces/clore/generate/cache/index" },
                                                        {
                                                            text: "functions",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "normalize-text-for-hashing", link: "/clore/namespaces/clore/generate/cache/functions/normalize-text-for-hashing" },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            text: "logging",
                                            collapsed: true,
                                            items: [
                                                { text: "Overview", link: "/clore/namespaces/clore/logging/index" },
                                                {
                                                    text: "functions",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "log", link: "/clore/namespaces/clore/logging/functions/log" },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            text: "net",
                                            collapsed: true,
                                            items: [
                                                { text: "Overview", link: "/clore/namespaces/clore/net/index" },
                                                {
                                                    text: "anthropic",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "Overview", link: "/clore/namespaces/clore/net/anthropic/index" },
                                                        { text: "detail", link: "/clore/namespaces/clore/net/anthropic/detail/index" },
                                                        {
                                                            text: "protocol",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "Overview", link: "/clore/namespaces/clore/net/anthropic/protocol/index" },
                                                                {
                                                                    text: "detail",
                                                                    collapsed: true,
                                                                    items: [
                                                                        { text: "Overview", link: "/clore/namespaces/clore/net/anthropic/protocol/detail/index" },
                                                                        {
                                                                            text: "functions",
                                                                            collapsed: true,
                                                                            items: [
                                                                                { text: "append-text-with-gap", link: "/clore/namespaces/clore/net/anthropic/protocol/detail/functions/append-text-with-gap" },
                                                                            ],
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    text: "functions",
                                                                    collapsed: true,
                                                                    items: [
                                                                        { text: "build-messages-url", link: "/clore/namespaces/clore/net/anthropic/protocol/functions/build-messages-url" },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        { text: "schema", link: "/clore/namespaces/clore/net/anthropic/schema/index" },
                                                    ],
                                                },
                                                {
                                                    text: "detail",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "Overview", link: "/clore/namespaces/clore/net/detail/index" },
                                                        {
                                                            text: "functions",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "select-event-loop", link: "/clore/namespaces/clore/net/detail/functions/select-event-loop" },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                {
                                                    text: "functions",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "icontains", link: "/clore/namespaces/clore/net/functions/icontains" },
                                                    ],
                                                },
                                                {
                                                    text: "openai",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "Overview", link: "/clore/namespaces/clore/net/openai/index" },
                                                        { text: "detail", link: "/clore/namespaces/clore/net/openai/detail/index" },
                                                        {
                                                            text: "protocol",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "Overview", link: "/clore/namespaces/clore/net/openai/protocol/index" },
                                                                { text: "detail", link: "/clore/namespaces/clore/net/openai/protocol/detail/index" },
                                                            ],
                                                        },
                                                        {
                                                            text: "schema",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "Overview", link: "/clore/namespaces/clore/net/openai/schema/index" },
                                                                { text: "detail", link: "/clore/namespaces/clore/net/openai/schema/detail/index" },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                { text: "protocol", link: "/clore/namespaces/clore/net/protocol/index" },
                                                { text: "schema", link: "/clore/namespaces/clore/net/schema/index" },
                                            ],
                                        },
                                        {
                                            text: "support",
                                            collapsed: true,
                                            items: [
                                                { text: "Overview", link: "/clore/namespaces/clore/support/index" },
                                                {
                                                    text: "functions",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "ensure-utf8", link: "/clore/namespaces/clore/support/functions/ensure-utf8" },
                                                        { text: "strip-utf8-bom", link: "/clore/namespaces/clore/support/functions/strip-utf8-bom" },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
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
                    { text: "catter", link: "/zh/catter/" },
                    { text: "clore", link: "/zh/clore/" },
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
                    "/zh/clore/": [
                        {
                            text: "API 参考",
                            items: [
                                { text: "概览", link: "/zh/clore/index" },
                            ],
                        },
                        {
                            text: "模块",
                            collapsed: false,
                            items: [
                                {
                                    text: "agent",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/modules/agent/index" },
                                        { text: "tools", link: "/zh/clore/modules/agent/tools" },
                                    ],
                                },
                                {
                                    text: "anthropic",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/modules/anthropic/index" },
                                        {
                                            text: "函数",
                                            collapsed: true,
                                            items: [
                                                { text: "append-text-with-gap", link: "/zh/clore/modules/anthropic/functions/append-text-with-gap" },
                                                { text: "build-messages-url", link: "/zh/clore/modules/anthropic/functions/build-messages-url" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    text: "client",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/modules/client/index" },
                                        {
                                            text: "函数",
                                            collapsed: true,
                                            items: [
                                                { text: "select-event-loop", link: "/zh/clore/modules/client/functions/select-event-loop" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    text: "config",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/modules/config/index" },
                                        { text: "load", link: "/zh/clore/modules/config/load" },
                                        { text: "normalize", link: "/zh/clore/modules/config/normalize" },
                                        { text: "schema", link: "/zh/clore/modules/config/schema" },
                                        { text: "validate", link: "/zh/clore/modules/config/validate" },
                                    ],
                                },
                                {
                                    text: "extract",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/modules/extract/index" },
                                        { text: "ast", link: "/zh/clore/modules/extract/ast" },
                                        { text: "cache", link: "/zh/clore/modules/extract/cache" },
                                        { text: "compiler", link: "/zh/clore/modules/extract/compiler" },
                                        { text: "filter", link: "/zh/clore/modules/extract/filter" },
                                        {
                                            text: "函数",
                                            collapsed: true,
                                            items: [
                                                { text: "ensure-cache-key-impl", link: "/zh/clore/modules/extract/functions/ensure-cache-key-impl" },
                                                { text: "ensure-cache-key", link: "/zh/clore/modules/extract/functions/ensure-cache-key" },
                                                { text: "normalize-entry-file", link: "/zh/clore/modules/extract/functions/normalize-entry-file" },
                                                { text: "scan-module-decl", link: "/zh/clore/modules/extract/functions/scan-module-decl" },
                                            ],
                                        },
                                        { text: "merge", link: "/zh/clore/modules/extract/merge" },
                                        { text: "model", link: "/zh/clore/modules/extract/model" },
                                        { text: "scan", link: "/zh/clore/modules/extract/scan" },
                                    ],
                                },
                                {
                                    text: "generate",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/modules/generate/index" },
                                        { text: "analysis", link: "/zh/clore/modules/generate/analysis" },
                                        { text: "cache", link: "/zh/clore/modules/generate/cache" },
                                        { text: "common", link: "/zh/clore/modules/generate/common" },
                                        { text: "diagram", link: "/zh/clore/modules/generate/diagram" },
                                        { text: "dryrun", link: "/zh/clore/modules/generate/dryrun" },
                                        { text: "evidence", link: "/zh/clore/modules/generate/evidence" },
                                        {
                                            text: "函数",
                                            collapsed: true,
                                            items: [
                                                { text: "normalize-text-for-hashing", link: "/zh/clore/modules/generate/functions/normalize-text-for-hashing" },
                                            ],
                                        },
                                        { text: "markdown", link: "/zh/clore/modules/generate/markdown" },
                                        { text: "model", link: "/zh/clore/modules/generate/model" },
                                        { text: "page", link: "/zh/clore/modules/generate/page" },
                                        { text: "planner", link: "/zh/clore/modules/generate/planner" },
                                        { text: "scheduler", link: "/zh/clore/modules/generate/scheduler" },
                                        { text: "symbol", link: "/zh/clore/modules/generate/symbol" },
                                    ],
                                },
                                { text: "http", link: "/zh/clore/modules/http/index" },
                                { text: "network", link: "/zh/clore/modules/network/index" },
                                { text: "openai", link: "/zh/clore/modules/openai/index" },
                                {
                                    text: "protocol",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/modules/protocol/index" },
                                        {
                                            text: "函数",
                                            collapsed: true,
                                            items: [
                                                { text: "icontains", link: "/zh/clore/modules/protocol/functions/icontains" },
                                            ],
                                        },
                                    ],
                                },
                                { text: "provider", link: "/zh/clore/modules/provider/index" },
                                { text: "schema", link: "/zh/clore/modules/schema/index" },
                                {
                                    text: "support",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/modules/support/index" },
                                        {
                                            text: "函数",
                                            collapsed: true,
                                            items: [
                                                { text: "ensure-utf8", link: "/zh/clore/modules/support/functions/ensure-utf8" },
                                                { text: "log", link: "/zh/clore/modules/support/functions/log" },
                                                { text: "strip-utf8-bom", link: "/zh/clore/modules/support/functions/strip-utf8-bom" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            text: "命名空间",
                            collapsed: false,
                            items: [
                                {
                                    text: "clore",
                                    collapsed: true,
                                    items: [
                                        { text: "概览", link: "/zh/clore/namespaces/clore/index" },
                                        { text: "agent", link: "/zh/clore/namespaces/clore/agent/index" },
                                        { text: "config", link: "/zh/clore/namespaces/clore/config/index" },
                                        {
                                            text: "extract",
                                            collapsed: true,
                                            items: [
                                                { text: "概览", link: "/zh/clore/namespaces/clore/extract/index" },
                                                {
                                                    text: "cache",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "概览", link: "/zh/clore/namespaces/clore/extract/cache/index" },
                                                    ],
                                                },
                                                {
                                                    text: "函数",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "ensure-cache-key-impl", link: "/zh/clore/namespaces/clore/extract/functions/ensure-cache-key-impl" },
                                                        { text: "ensure-cache-key", link: "/zh/clore/namespaces/clore/extract/functions/ensure-cache-key" },
                                                        { text: "normalize-entry-file", link: "/zh/clore/namespaces/clore/extract/functions/normalize-entry-file" },
                                                        { text: "scan-module-decl", link: "/zh/clore/namespaces/clore/extract/functions/scan-module-decl" },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            text: "generate",
                                            collapsed: true,
                                            items: [
                                                { text: "概览", link: "/zh/clore/namespaces/clore/generate/index" },
                                                {
                                                    text: "cache",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "概览", link: "/zh/clore/namespaces/clore/generate/cache/index" },
                                                        {
                                                            text: "函数",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "normalize-text-for-hashing", link: "/zh/clore/namespaces/clore/generate/cache/functions/normalize-text-for-hashing" },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            text: "logging",
                                            collapsed: true,
                                            items: [
                                                { text: "概览", link: "/zh/clore/namespaces/clore/logging/index" },
                                                {
                                                    text: "函数",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "log", link: "/zh/clore/namespaces/clore/logging/functions/log" },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            text: "net",
                                            collapsed: true,
                                            items: [
                                                { text: "概览", link: "/zh/clore/namespaces/clore/net/index" },
                                                {
                                                    text: "anthropic",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "概览", link: "/zh/clore/namespaces/clore/net/anthropic/index" },
                                                        { text: "detail", link: "/zh/clore/namespaces/clore/net/anthropic/detail/index" },
                                                        {
                                                            text: "protocol",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "概览", link: "/zh/clore/namespaces/clore/net/anthropic/protocol/index" },
                                                                {
                                                                    text: "detail",
                                                                    collapsed: true,
                                                                    items: [
                                                                        { text: "概览", link: "/zh/clore/namespaces/clore/net/anthropic/protocol/detail/index" },
                                                                        {
                                                                            text: "函数",
                                                                            collapsed: true,
                                                                            items: [
                                                                                { text: "append-text-with-gap", link: "/zh/clore/namespaces/clore/net/anthropic/protocol/detail/functions/append-text-with-gap" },
                                                                            ],
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    text: "函数",
                                                                    collapsed: true,
                                                                    items: [
                                                                        { text: "build-messages-url", link: "/zh/clore/namespaces/clore/net/anthropic/protocol/functions/build-messages-url" },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        { text: "schema", link: "/zh/clore/namespaces/clore/net/anthropic/schema/index" },
                                                    ],
                                                },
                                                {
                                                    text: "detail",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "概览", link: "/zh/clore/namespaces/clore/net/detail/index" },
                                                        {
                                                            text: "函数",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "select-event-loop", link: "/zh/clore/namespaces/clore/net/detail/functions/select-event-loop" },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                {
                                                    text: "函数",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "icontains", link: "/zh/clore/namespaces/clore/net/functions/icontains" },
                                                    ],
                                                },
                                                {
                                                    text: "openai",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "概览", link: "/zh/clore/namespaces/clore/net/openai/index" },
                                                        { text: "detail", link: "/zh/clore/namespaces/clore/net/openai/detail/index" },
                                                        {
                                                            text: "protocol",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "概览", link: "/zh/clore/namespaces/clore/net/openai/protocol/index" },
                                                                { text: "detail", link: "/zh/clore/namespaces/clore/net/openai/protocol/detail/index" },
                                                            ],
                                                        },
                                                        {
                                                            text: "schema",
                                                            collapsed: true,
                                                            items: [
                                                                { text: "概览", link: "/zh/clore/namespaces/clore/net/openai/schema/index" },
                                                                { text: "detail", link: "/zh/clore/namespaces/clore/net/openai/schema/detail/index" },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                { text: "protocol", link: "/zh/clore/namespaces/clore/net/protocol/index" },
                                                { text: "schema", link: "/zh/clore/namespaces/clore/net/schema/index" },
                                            ],
                                        },
                                        {
                                            text: "support",
                                            collapsed: true,
                                            items: [
                                                { text: "概览", link: "/zh/clore/namespaces/clore/support/index" },
                                                {
                                                    text: "函数",
                                                    collapsed: true,
                                                    items: [
                                                        { text: "ensure-utf8", link: "/zh/clore/namespaces/clore/support/functions/ensure-utf8" },
                                                        { text: "strip-utf8-bom", link: "/zh/clore/namespaces/clore/support/functions/strip-utf8-bom" },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        },
    },
}));
