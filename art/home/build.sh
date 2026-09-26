#!/usr/bin/env bash
# Rebuild the homepage art in ../../public/ from sources/.
set -euo pipefail
cd "$(dirname "$0")"

python3 - <<'PY'
from PIL import Image


def hero(src, out):
    """Trim a figure to her silhouette with a small margin and size it for a
    2x display at up to 560 px tall."""
    im = Image.open(src).convert("RGBA")
    left, top, right, bottom = im.getchannel("A").getbbox()
    pad = 12
    im = im.crop((max(left - pad, 0), max(top - pad, 0), min(right + pad, im.width), min(bottom + pad, im.height)))
    height = 1120
    im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    im.save(out, quality=90, method=6)


hero("sources/hero-quiet-01.png", "../../public/mascot/hero-home.webp")
PY
