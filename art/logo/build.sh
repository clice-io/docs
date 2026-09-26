#!/usr/bin/env bash
# Rebuild every logo file from the character layers in sources/.
# 1024 px masters go to masters/, the site's icons to ../../public/, and the
# VS Code extension icon to exports/.
set -euo pipefail
cd "$(dirname "$0")"

FILL='#cfdcf0'
compose() { python3 compose_icon.py "$@"; }

# Navbar and footer: the square icon's framing with a circle 1.12 times its
# side drawn around it, so the longer-bodied layer fills the extra ring and
# nothing is cramped; nudged right to balance the bow.
compose sources/bust-02.png masters/logo-circle.png --circle --fill "$FILL" \
    --scale 0.7277 --dx 0.0078 --dy 0.1259 --bw 0.04
# Favicons: simplified layer, thinner blue ring so it stays soft at 16 px;
# nudged right like the navbar logo to balance the bow.
compose sources/fav-bust-02.png masters/favicon.png --circle --fill "$FILL" \
    --scale 0.82 --dx -0.0239 --dy -0.005 --bw 0.05 --border '#2f4c85'
# VS Code: rounded square, nothing breaks out of the frame.
compose sources/bust-01.png masters/vscode-icon.png --contain --fill "$FILL" --scale 0.86
# apple-touch: opaque full-bleed square; iOS rounds the corners itself.
compose sources/bust-01.png masters/apple-touch.png --bleed --fill "$FILL" --scale 0.82

python3 - <<'PY'
from PIL import Image, ImageFilter

PUBLIC = "../../public/"
Image.open("masters/logo-circle.png").resize((128, 128), Image.LANCZOS).save(
    PUBLIC + "mascot/logo-mark.webp", lossless=True)
fav = Image.open("masters/favicon.png")
for size in (16, 32, 48, 64):
    im = fav.resize((size, size), Image.LANCZOS)
    if size <= 32:
        # A light unsharp mask keeps the eyes from dissolving at tab size.
        im = im.filter(ImageFilter.UnsharpMask(radius=0.6, percent=80, threshold=0))
    im.save(f"{PUBLIC}favicon-{size}.png")
# Some clients request /favicon.ico regardless of the <link> tags.
Image.open(f"{PUBLIC}favicon-48.png").save(
    PUBLIC + "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[Image.open(f"{PUBLIC}favicon-{n}.png") for n in (16, 32)])
Image.open("masters/apple-touch.png").convert("RGB").resize((180, 180), Image.LANCZOS).save(
    PUBLIC + "apple-touch-icon.png")
Image.open("masters/vscode-icon.png").resize((256, 256), Image.LANCZOS).save("exports/vscode-icon.png")
PY
