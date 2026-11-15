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

// Chapter icons: line drawings on a 24 px grid, stroked in the theme's ink
// like the portal page's project icons. A section without one shows none.
// The sidebar renders item text as HTML.
const CHAPTER_ICONS: Record<string, string> = {
    // a signpost
    guide: '<path d="M12 3v18M12 5.5h6.5l2.5 2.5-2.5 2.5H12M12 12.5H5.5L3 15l2.5 2.5H12"/>',
    // a toolbox
    features: '<path d="M3 9h18v10H3zM8.5 9V6.5h7V9M3 13.5h18"/><path d="M10.5 12.5v2h3v-2"/>',
    // a terminal and its prompt
    cli: '<path d="M3 5h18v14H3zM3 8.5h18M6.5 12l3 2.5-3 2.5M12 17h5"/>',
    // a script: a page of code
    scripting: '<path d="M6 3h8.5L19 7.5V21H6zM14.5 3v4.5H19M10.5 11.5 8.5 14l2 2.5M14.5 11.5l2 2.5-2 2.5"/>',
    // a plug
    integrations: '<path d="M9 3v5M15 3v5M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0zM12 17v4"/>',
    // a book
    reference: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7h6"/>',
    // a drafting compass
    design: '<circle cx="12" cy="5" r="1.8"/><path d="M11 6.6 6 20M13 6.6 18 20M8 15h8"/>',
    // a wrench
    dev: '<path d="M14.5 4.2a4.5 4.5 0 0 0-5.3 6L3.5 16a2 2 0 0 0 2.9 2.9l5.7-5.7a4.5 4.5 0 0 0 6-5.3l-2.7 2.7-2.4-.5-.5-2.4z"/>',
};

function groupLabel(dir: string, label: string): string {
    const icon = CHAPTER_ICONS[dir];
    if (icon === undefined) return label;
    return `<svg class="chapter-icon" viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>${label}`;
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
                text: groupLabel(dir, group?.label || titleCase(dir)),
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
