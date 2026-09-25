import fs from "node:fs";
import { createRequire } from "node:module";
import { defineLoader } from "vitepress";

/**
 * The simple-icons set holds thousands of icons; importing its JSON from a
 * component bundles all of them into every page. This build-time loader
 * hands the client only the bodies <BrandIcon> is asked for.
 */

const NAMES = ["apple", "discord", "github", "linux", "neovim", "visualstudiocode", "windows", "zedindustries"];

export type BrandIcons = Record<string, string>;

declare const data: BrandIcons;
export { data };

export default defineLoader({
    load(): BrandIcons {
        const require = createRequire(import.meta.url);
        const file = require.resolve("@iconify-json/simple-icons/icons.json");
        const { icons } = JSON.parse(fs.readFileSync(file, "utf8")) as { icons: Record<string, { body: string }> };
        return Object.fromEntries(
            NAMES.map((name) => {
                const icon = icons[name];
                if (!icon) throw new Error(`simple-icons has no icon named "${name}"`);
                return [name, icon.body];
            }),
        );
    },
});
