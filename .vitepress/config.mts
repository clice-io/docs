import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "Project Clice",
    description: "新一代 C++ 工具链",
    cleanUrls: true,
    rewrites: {
        "en/:rest*": ":rest*",
    },
    themeConfig: {
        socialLinks: [
            { icon: 'github', link: 'https://github.com/clice-io' }
        ],
        outline: "deep",
    },
    locales: {
        root: {
            label: 'English',
            lang: 'en-US',
            link: '/',
        },
        zh: {
            label: '简体中文',
            lang: 'zh-CN',
            link: '/zh'
        },
        fr: {
            label: 'Français',
            lang: 'fr-FR',
            link: '/fr',
        },
        ja: {
            label: '日本語',
            lang: 'ja-JP',
            link: '/ja',
        }
    }
})
