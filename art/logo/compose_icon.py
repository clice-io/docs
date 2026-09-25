"""Composite the character layer into a code-drawn rounded panel.

The panel crops her at the sides and bottom; only above the top border may
the hair and bow break out (unless --contain or --circle). Shape, background,
border and shadow are parameters, so the same character layer yields every
icon variant.

usage: python3 compose_icon.py <character.png> <out.png> [--fill #4568a7] [--size 1024]
       [--scale 1.0] [--dx 0] [--dy 0] [--shadow 0] [--bw 0.045] [--bleed] [--contain] [--circle]
"""
import argparse

from PIL import Image, ImageChops, ImageDraw

INK = "#2b3040"
WORK = 2048  # drawn at 2048 and downsampled for smooth edges


def rounded(box, radius):
    m = Image.new("L", (WORK, WORK), 0)
    ImageDraw.Draw(m).rounded_rectangle(box, radius, fill=255)
    return m


def disc(box):
    m = Image.new("L", (WORK, WORK), 0)
    ImageDraw.Draw(m).ellipse(box, fill=255)
    return m


def extend_body(char, extra=0.3):
    """Continue the straight body cut downward by repeating its last solid row.

    The layer ends in a flat cut at mid-chest. Once the head is centred in a
    circle, that cut can land above the frame and leave a gap; the collar,
    straps and blouse run vertically there, so repeating the row reads as more
    of the same clothes and the frame always does the cropping.
    """
    row = char.crop((0, char.height - 4, char.width, char.height - 3))
    a = row.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    row.putalpha(a)
    # The neck ribbon's tails end at the cut; repeated they would run down to
    # the frame, so continue them as plain blouse instead.
    px = row.load()
    light = [px[i, 0] for i in range(row.width) if min(px[i, 0][:3]) > 225 and px[i, 0][3]]
    tail = char.crop((0, char.height - char.height // 12, char.width, char.height)).load()
    red = [i for i in range(row.width) for j in range(char.height // 12)
           if tail[i, j][3] and tail[i, j][0] > 150 and tail[i, j][1] < 130 and tail[i, j][2] < 130]
    if light and red:
        blouse = max(set(light), key=light.count)
        pad = max(2, char.width // 150)  # also swallow the tails' ink outline
        for i in range(max(min(red) - pad, 0), min(max(red) + pad + 1, row.width)):
            px[i, 0] = blouse
    add = int(char.height * extra)
    out = Image.new("RGBA", (char.width, char.height + add))
    out.paste(char, (0, 0))
    out.paste(row.resize((char.width, add), Image.NEAREST), (0, char.height - 3))
    return out


def compose(char, fill, border=INK, scale=1.0, dx=0.0, dy=0.0, shadow=0.0, bleed=False, contain=False,
            circle=False, bwr=0.045):
    S = WORK
    if bleed:
        # Full-bleed square (apple-touch): the OS rounds the corners itself.
        L, T, R, B, bw, rad = 0, int(S * 0.13), S, S, 0, 0
        outer = Image.new("L", (S, S), 0)
        ImageDraw.Draw(outer).rectangle((0, 0, S, S), fill=255)
        inner = outer
    elif circle:
        contain = True
        m = int(S * 0.02)
        L, T, R, B, bw = m, m, S - m, S - m, int(S * bwr)
        outer = disc((L, T, R, B))
        inner = disc((L + bw, T + bw, R - bw, B - bw))
    else:
        m, sh = int(S * 0.035), int(S * shadow)
        L, T, R, B = m, m if contain else int(S * 0.15), S - m - sh, S - m - sh
        bw, rad = int(S * bwr), int((R - L) * 0.2)
        outer = rounded((L, T, R, B), rad)
        inner = rounded((L + bw, T + bw, R - bw, B - bw), rad - bw)

    # Character: width relative to the panel, bottom cut hidden below it.
    w = int((R - L) * 1.02 * scale)
    h = int(char.height * w / char.width)
    ch = extend_body(char.resize((w, h), Image.LANCZOS))
    layer = Image.new("RGBA", (S, S))
    x = (L + R - w) // 2 + int(dx * S)
    # Contained: the bow's top sits just inside the top border; otherwise the
    # body is anchored to the bottom and the head breaks out above.
    y = (T + bw + int(S * 0.02) if contain else B - bw - int(h * 0.97)) + int(dy * S)
    # alpha_composite rejects negative offsets: crop the part off the canvas instead.
    layer.alpha_composite(ch, (max(x, 0), max(y, 0)), (max(-x, 0), max(-y, 0)))

    def masked(img, mask):
        out = img.copy()
        out.putalpha(ImageChops.multiply(img.getchannel("A"), mask))
        return out

    top = Image.new("L", (S, S), 0)
    if not contain:
        ImageDraw.Draw(top).rectangle((L, 0, R, T + bw), fill=255)

    canvas = Image.new("RGBA", (S, S))
    if shadow and not bleed:
        sh = int(S * shadow)
        canvas.paste(Image.new("RGBA", (S, S), border), (0, 0), rounded((L + sh, T + sh, R + sh, B + sh), rad))
    canvas.paste(Image.new("RGBA", (S, S), fill), (0, 0), outer)
    canvas.alpha_composite(masked(layer, inner))
    if bw:
        canvas.paste(Image.new("RGBA", (S, S), border), (0, 0), ImageChops.subtract(outer, inner))
    canvas.alpha_composite(masked(layer, top))
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("char")
    ap.add_argument("out")
    ap.add_argument("--fill", default="#4568a7")
    ap.add_argument("--border", default=INK)
    ap.add_argument("--size", type=int, default=1024)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--dx", type=float, default=0.0)
    ap.add_argument("--dy", type=float, default=0.0)
    ap.add_argument("--shadow", type=float, default=0.0)
    ap.add_argument("--bleed", action="store_true")
    ap.add_argument("--contain", action="store_true", help="square panel, nothing breaks out")
    ap.add_argument("--circle", action="store_true", help="round panel, nothing breaks out")
    ap.add_argument("--bw", type=float, default=0.045, help="border width, fraction of the canvas")
    a = ap.parse_args()
    char = Image.open(a.char).convert("RGBA")
    # The generator leaves interiors at alpha 253-254 and a faint haze outside.
    char.putalpha(char.getchannel("A").point(lambda v: 0 if v <= 3 else 255 if v >= 248 else v))
    char = char.crop(char.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
    img = compose(char, a.fill, a.border, a.scale, a.dx, a.dy, a.shadow, a.bleed, a.contain, a.circle, a.bw)
    img.resize((a.size, a.size), Image.LANCZOS).save(a.out)


if __name__ == "__main__":
    main()
