import fs from "fs";
import path from "path";
import type { DefaultTheme } from "vitepress";

function extractTitle(filePath: string): string {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^#\s+(.*)/m);
    return match ? match[1] : path.basename(filePath, ".md");
}

function titleCase(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

export function genProjectSidebar(project: string, lang: "en" | "zh"): DefaultTheme.SidebarItem[] {
    const baseDir = path.resolve(process.cwd(), lang, project);
    if (!fs.existsSync(baseDir)) return [];

    const prefix = lang === "en" ? `/${project}` : `/zh/${project}`;

    const dirs = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_"))
        .map(e => e.name)
        .sort();

    return dirs.map(dir => {
        const dirPath = path.resolve(baseDir, dir);
        const files = fs.readdirSync(dirPath)
            .filter(f => f.endsWith(".md"))
            .sort();

        const items = files.map(file => ({
            text: extractTitle(path.resolve(dirPath, file)),
            link: `${prefix}/${dir}/${file.replace(".md", "")}`,
        }));

        return { text: titleCase(dir), items };
    });
}

export function genSidebar(projects: string[], lang: "en" | "zh"): Record<string, DefaultTheme.SidebarItem[]> {
    const sidebar: Record<string, DefaultTheme.SidebarItem[]> = {};
    const prefix = lang === "en" ? "" : "/zh";
    for (const p of projects) {
        sidebar[`${prefix}/${p}/`] = genProjectSidebar(p, lang);
    }
    return sidebar;
}
