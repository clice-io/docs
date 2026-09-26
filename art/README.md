# Site art

Source images for the site's artwork, kept next to the scripts that turn them
into the files under `public/`. VitePress ignores this folder (`srcExclude`);
nothing here is served directly.

Each family gets its own folder with the same layout:

| Path | Contents |
| --- | --- |
| `sources/` | Raw generator output, untouched, each with its `.prompt.txt` |
| `masters/` | Full-size composites (1024 px) built from `sources/` |
| `exports/` | Derived files used outside this site |
| `build.sh` | Rebuilds `masters/`, `exports/` and the files in `public/` |

Edit the parameters in `build.sh` and rerun it rather than touching files in
`public/` by hand.

## logo/

The mascot's bust, drawn once as a transparent layer, composited by
`compose_icon.py` into a code-drawn frame on a pale blue (`#cfdcf0`) ground.
The frame crops her at the sides and bottom, so the ground, border and shape
can change without regenerating her.

| Source | Used for |
| --- | --- |
| `sources/bust-01.png` | Navbar logo (circle), VS Code icon (rounded square), apple-touch icon (full-bleed square) |
| `sources/fav-bust-02.png` | Favicons: the same bust simplified, with colour-traced lines, so it survives 16–48 px |

Both layers were generated with Codex `image_gen` (gpt-image-2, reasoning
effort xhigh). References: `bust-01` used an earlier framed candidate plus the
approved original ink portrait and character sheet; `fav-bust-02` used
`bust-01` and a rejected simplification (lines too black).

| Output | Path |
| --- | --- |
| Navbar logo, 128 px | `public/mascot/logo-mark.webp` |
| Favicons, 16/32/48/64 px, and a 16/32/48 `.ico` | `public/favicon-*.png`, `public/favicon.ico` |
| apple-touch icon, 180 px | `public/apple-touch-icon.png` |
| VS Code extension icon, 256 px | `logo/exports/vscode-icon.png` |

Requires Python 3 with Pillow: `art/logo/build.sh`.

## home/

| Source | Used for |
| --- | --- |
| `sources/hero-quiet-01.png` | Homepage hero (`public/mascot/hero-home.webp`): trimmed to the figure and sized 1120 px tall for 2x displays |

Generated with Codex `image_gen` (gpt-image-2, reasoning effort xhigh): a
redraw of an earlier clasped-hands candidate that kept its head and fixed the
body (shoulders following the head tilt, narrower skirt), referencing the
approved full-body illustration, character sheet and colour portrait. The
homepage's speech-bubble tail aims at her mouth; its position in the image is
`HERO.mouth` in `HomeLanding.vue` and needs updating if the image changes.
