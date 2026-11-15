// Checks the built site's links to a section (`page#anchor`, `#anchor`):
// each must name an id on its page. VitePress checks that linked pages
// exist, not their sections; a zh heading that lost its en anchor (see
// .vitepress/anchors.ts) shows up here.
//
// usage: node tools/check-anchors.mjs [.vitepress/dist]
import fs from "node:fs";
import path from "node:path";

const dist = process.argv[2] ?? ".vitepress/dist";
const unescape = (s) =>
    s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const pages = new Map(); // url -> { ids, links }
for (const file of fs.readdirSync(dist, { recursive: true, encoding: "utf8" })) {
    if (!file.endsWith(".html")) continue;
    const rel = file.split(path.sep).join("/");
    const url = "/" + rel.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(dist, file), "utf8");
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => unescape(m[1])));
    // links in the page's content, not the nav or footer
    const start = html.indexOf('class="vp-doc');
    const links = start < 0 ? [] : [...html.slice(start).matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => unescape(m[1]));
    pages.set(url.replace(/\/$/, "") || "/", { ids, links });
}

const broken = [];
for (const [url, { links }] of pages) {
    for (const href of links) {
        if (/^[a-z]+:/i.test(href)) continue;
        const [where, hash] = href.split("#", 2);
        if (!hash) continue;
        const target = (where ? new URL(where, `https://site${url}`).pathname : url).replace(/\.html$/, "").replace(/\/$/, "") || "/";
        const page = pages.get(target);
        if (page && !page.ids.has(decodeURIComponent(hash))) broken.push(`${url}: ${href}`);
    }
}

if (broken.length) {
    for (const line of broken) console.log(`::error title=Broken section link::${line}`);
    console.log(`${broken.length} links name a section their page does not have`);
    process.exit(1);
}
console.log(`every section link of ${pages.size} pages resolves`);
