import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { DefaultTheme } from "vitepress";

interface SidebarEntry {
    file: string;
    label?: string;
    hidden?: boolean;
}

interface SidebarGroup {
    label?: string;
    collapsed?: boolean;
    hidden?: boolean;
    items?: (string | SidebarEntry)[];
}

type SidebarConfig = Record<string, SidebarGroup>;

function extractTitle(filePath: string): string {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^#\s+(.*)/m);
    return match ? match[1] : path.basename(filePath, ".md");
}

function titleCase(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function loadConfig(lang: "en" | "zh", project: string): SidebarConfig | null {
    const configPath = path.resolve(process.cwd(), lang, project, "sidebar.yaml");
    if (!fs.existsSync(configPath)) return null;
    return yaml.load(fs.readFileSync(configPath, "utf-8")) as SidebarConfig;
}

function resolveEntry(entry: string | SidebarEntry): SidebarEntry {
    if (typeof entry === "string") return { file: entry };
    return entry;
}

export function genProjectSidebar(project: string, lang: "en" | "zh"): DefaultTheme.SidebarItem[] {
    const baseDir = path.resolve(process.cwd(), lang, project);
    if (!fs.existsSync(baseDir)) return [];

    const prefix = lang === "en" ? `/${project}` : `/zh/${project}`;
    const config = loadConfig(lang, project);

    const allDirs = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && !e.name.startsWith("."))
        .map(e => e.name);

    let dirOrder: string[];
    if (config) {
        const configured = Object.keys(config);
        const rest = allDirs.filter(d => !configured.includes(d)).sort();
        dirOrder = [...configured.filter(d => allDirs.includes(d)), ...rest];
    } else {
        dirOrder = allDirs.sort();
    }

    return dirOrder
        .filter(dir => !config?.[dir]?.hidden)
        .map(dir => {
            const dirPath = path.resolve(baseDir, dir);
            const group = config?.[dir];

            const allFiles = fs.readdirSync(dirPath)
                .filter(f => f.endsWith(".md"))
                .map(f => f.replace(".md", ""));

            let fileOrder: SidebarEntry[];
            if (group?.items) {
                const entries = group.items.map(resolveEntry);
                const configuredNames = entries.map(e => e.file);
                const rest = allFiles
                    .filter(f => !configuredNames.includes(f))
                    .sort()
                    .map(f => ({ file: f }));
                fileOrder = [...entries.filter(e => allFiles.includes(e.file)), ...rest];
            } else {
                fileOrder = allFiles.sort().map(f => ({ file: f }));
            }

            const items = fileOrder
                .filter(entry => !entry.hidden)
                .map(entry => ({
                    text: entry.label || extractTitle(path.resolve(dirPath, `${entry.file}.md`)),
                    link: `${prefix}/${dir}/${entry.file}`,
                }));

            const result: DefaultTheme.SidebarItem = {
                text: group?.label || titleCase(dir),
                items,
            };

            if (group?.collapsed !== undefined) {
                result.collapsed = group.collapsed;
            }

            return result;
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
