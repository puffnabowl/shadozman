"""Generates the "tell" for each shadow: the eyes, hands or smile you spot first,
before the whole shadow reveals itself. Used as map markers and as the first
thing that fades in from a dark spot during a hunt.

Run: python3 tools/gen_tells.py   (writes public/shadows/tells/<id>.svg)
"""
import math
import os
import random
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "shadows", "tells")
BODY = "#0a0910"


def f(n):
    return f"{n:.1f}".rstrip("0").rstrip(".")


def wrap(title, glow, inner, seed=1):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
<title>{title}</title>
<defs>
<radialGradient id="dark" cx="128" cy="128" r="124" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#000" stop-opacity="0.85"/>
<stop offset="0.6" stop-color="#000" stop-opacity="0.55"/>
<stop offset="1" stop-color="#000" stop-opacity="0"/>
</radialGradient>
<radialGradient id="aura" cx="128" cy="128" r="110" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="{glow}" stop-opacity="0.3"/>
<stop offset="1" stop-color="{glow}" stop-opacity="0"/>
</radialGradient>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
<feGaussianBlur stdDeviation="4" result="b"/>
<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="rim" x="-30%" y="-30%" width="160%" height="160%">
<feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d"/>
<feGaussianBlur in="d" stdDeviation="3" result="b"/>
<feFlood flood-color="{glow}" flood-opacity="0.7"/>
<feComposite in2="b" operator="in" result="r"/>
<feMerge><feMergeNode in="r"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="wisp" x="-20%" y="-20%" width="140%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="{seed}" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
</defs>
<circle cx="128" cy="128" r="124" fill="url(#dark)"/>
<circle cx="128" cy="128" r="110" fill="url(#aura)"/>
{inner}
</svg>
"""


# ── Eyes ────────────────────────────────────────────────────────────────


def almond(cx, cy, w, h, glow, pupil="slit", tilt=0):
    d = f"M{f(cx - w / 2)} {f(cy)}Q{f(cx)} {f(cy - h)} {f(cx + w / 2)} {f(cy)}Q{f(cx)} {f(cy + h)} {f(cx - w / 2)} {f(cy)}z"
    if pupil == "slit":
        p = f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(w * 0.06)}" ry="{f(h * 0.62)}" fill="#000"/>'
    elif pupil == "dot":
        p = f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(h * 0.3)}" fill="#000"/>'
    else:
        p = ""
    return (f'<g transform="rotate({f(tilt)} {f(cx)} {f(cy)})"><path d="{d}" fill="{glow}" filter="url(#glow)"/>'
            f'<path d="{d}" fill="#fff" opacity=".35" transform="translate({f(cx * 0.3)} {f(cy * 0.3)}) scale(.7)"/>{p}</g>')


def eyes_tell(glow, gap=70, w=54, h=22, pupil="slit", tilt=10, many=0, seed=1):
    out = [almond(128 - gap / 2, 124, w, h, glow, pupil, tilt), almond(128 + gap / 2, 124, w, h, glow, pupil, -tilt)]
    rnd = random.Random(seed)
    for _ in range(many):
        x, y = rnd.uniform(40, 216), rnd.uniform(50, 210)
        if abs(y - 124) < 30 and abs(x - 128) < 80:
            continue
        s = rnd.uniform(0.25, 0.5)
        out.append(almond(x, y, w * s, h * s, glow, "slit", rnd.uniform(-15, 15)))
    return "".join(out)


# ── Hands ───────────────────────────────────────────────────────────────


def hand(wx, wy, angle, size, spread=0.32, curl=0.0, side=1):
    """A long-fingered shadow hand: wrist at (wx, wy), pointing at `angle` (radians)."""
    parts = []
    palm_len = size * 0.42
    px, py = wx + math.cos(angle) * palm_len, wy + math.sin(angle) * palm_len
    parts.append(f'<path d="M{f(wx)} {f(wy)}L{f(px)} {f(py)}" stroke-width="{f(size * 0.4)}"/>')
    # arm trailing off the edge
    ax, ay = wx - math.cos(angle) * size * 1.6, wy - math.sin(angle) * size * 1.6
    parts.append(f'<path d="M{f(ax)} {f(ay)}L{f(wx)} {f(wy)}" stroke-width="{f(size * 0.26)}"/>')
    for i, length in enumerate((0.78, 0.92, 0.86, 0.66)):
        a = angle + (i - 1.5) * spread * 0.55 * side
        bx, by = px + math.cos(a + (i - 1.5) * 0.12) * size * 0.08, py + math.sin(a + (i - 1.5) * 0.12) * size * 0.08
        L = size * length
        mx, my = bx + math.cos(a) * L * 0.55, by + math.sin(a) * L * 0.55
        a2 = a + curl * side
        tx, ty = mx + math.cos(a2) * L * 0.45, my + math.sin(a2) * L * 0.45
        parts.append(f'<path d="M{f(bx)} {f(by)}L{f(mx)} {f(my)}L{f(tx)} {f(ty)}" stroke-width="{f(size * 0.11)}"/>')
    ta = angle - 1.1 * side
    tx1, ty1 = wx + math.cos(angle) * palm_len * 0.4, wy + math.sin(angle) * palm_len * 0.4
    tx2, ty2 = tx1 + math.cos(ta) * size * 0.45, ty1 + math.sin(ta) * size * 0.45
    parts.append(f'<path d="M{f(tx1)} {f(ty1)}L{f(tx2)} {f(ty2)}" stroke-width="{f(size * 0.12)}"/>')
    return "".join(parts)


def hands_tell(glow, layout="pair", size=70, curl=0.25, seed=1, nails=True):
    if layout == "pair":
        hs = [hand(88, 244, -math.pi / 2 - 0.2, size, curl=curl, side=-1), hand(168, 244, -math.pi / 2 + 0.2, size, curl=curl, side=1)]
    elif layout == "one":
        hs = [hand(122, 250, -math.pi / 2 + 0.1, size * 1.35, curl=curl, side=1)]
    elif layout == "edge":  # gripping round an edge from the side
        hs = [hand(20, 100, -0.1, size * 1.2, curl=0.7, side=1), hand(20, 168, 0.15, size * 1.1, curl=0.8, side=1)]
    elif layout == "reach":  # long single hand reaching down from above
        hs = [hand(150, 4, math.pi / 2 - 0.2, size * 1.35, spread=0.45, curl=curl, side=-1)]
    else:
        raise ValueError(layout)
    body = (f'<g filter="url(#wisp)"><g filter="url(#rim)" stroke="{BODY}" fill="none" stroke-linecap="round" stroke-linejoin="round">'
            f'{"".join(hs)}</g></g>')
    return body


# ── Smile ───────────────────────────────────────────────────────────────


def smile_tell(glow, width=170, depth=56, teeth=14, sharp=True, eyes_too=False, tilt=0, seed=1):
    x0, x1, y = 128 - width / 2, 128 + width / 2, 118
    outer = f"M{f(x0)} {f(y)}Q128 {f(y + depth * 2)} {f(x1)} {f(y)}Q128 {f(y + depth * 0.9)} {f(x0)} {f(y)}z"
    # teeth: triangles along the upper lip, pointing down
    tt = []
    for i in range(teeth):
        t0, t1 = (i + 0.15) / teeth, (i + 0.85) / teeth
        tm = (t0 + t1) / 2

        def upper(t):
            # quadratic upper lip
            return ((1 - t) ** 2 * x0 + 2 * (1 - t) * t * 128 + t * t * x1,
                    (1 - t) ** 2 * y + 2 * (1 - t) * t * (y + depth * 0.9) + t * t * y)

        (ax, ay), (bx, by), (mx, my) = upper(t0), upper(t1), upper(tm)
        edge = 1 - abs(tm - 0.5) * 2
        L = depth * (0.22 + 0.28 * edge)
        if sharp:
            tt.append(f'M{f(ax)} {f(ay)}L{f(mx)} {f(my + L)}L{f(bx)} {f(by)}z')
        else:
            tt.append(f'M{f(ax)} {f(ay)}L{f(ax)} {f(ay + L * 0.7)}Q{f(mx)} {f(my + L)} {f(bx)} {f(by + L * 0.7)}L{f(bx)} {f(by)}z')
    lower = []
    for i in range(teeth - 2):
        t = (i + 1.5) / teeth
        lx = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * 128 + t * t * x1
        ly = (1 - t) ** 2 * y + 2 * (1 - t) * t * (y + depth * 2) + t * t * y
        edge = 1 - abs(t - 0.5) * 2
        L = depth * (0.18 + 0.2 * edge)
        w = width / teeth * 0.35
        lower.append(f'M{f(lx - w)} {f(ly - 1)}L{f(lx)} {f(ly - L)}L{f(lx + w)} {f(ly - 1)}z')
    out = (f'<g transform="rotate({f(tilt)} 128 128)">'
           f'<path d="{outer}" fill="#000" stroke="{glow}" stroke-width="3" filter="url(#glow)"/>'
           f'<path d="{"".join(tt)}{"".join(lower)}" fill="{glow}" filter="url(#glow)"/>'
           f'<path d="{"".join(tt)}" fill="#fff" opacity=".35"/>'
           f'</g>')
    if eyes_too:
        out = (f'<g fill="{glow}" filter="url(#glow)"><circle cx="100" cy="76" r="9"/><circle cx="156" cy="76" r="9"/></g>'
               '<circle cx="100" cy="76" r="3.5" fill="#000"/><circle cx="156" cy="76" r="3.5" fill="#000"/>') + out
    return out


# ── Per-species tells ───────────────────────────────────────────────────

TELLS = {
    # eyes
    "lurkling": ("eyes", lambda g: eyes_tell(g, gap=60, w=40, h=24, pupil="dot", tilt=0)),
    "hallwalker": ("eyes", lambda g: eyes_tell(g, gap=56, w=40, h=14, pupil="slit", tilt=0)),
    "pinewatch": ("eyes", lambda g: eyes_tell(g, gap=40, w=30, h=14, pupil="slit", tilt=4)),
    "sleepsitter": ("eyes", lambda g: eyes_tell(g, gap=80, w=60, h=30, pupil="slit", tilt=-8)),
    "ferrymute": ("eyes", lambda g: eyes_tell(g, gap=48, w=34, h=10, pupil="none", tilt=0)),
    "mirrorkin": ("eyes", lambda g: eyes_tell(g, gap=64, w=46, h=18, pupil="dot", tilt=0)
                  + f'<g opacity=".35" transform="translate(0 70)">{eyes_tell(g, gap=64, w=46, h=18, pupil="dot", tilt=0)}</g>'),
    "the-unlit": ("eyes", lambda g: eyes_tell(g, gap=0, w=110, h=34, pupil="slit", tilt=0, many=26, seed=30)),
    # hands
    "stairbottom": ("hands", lambda g: hands_tell(g, "edge", size=72, seed=5)),
    "puddlegaunt": ("hands", lambda g: hands_tell(g, "one", size=74, curl=0.35)
                    + "".join(f'<ellipse cx="128" cy="232" rx="{r}" ry="{r * 0.25}" fill="none" stroke="{g}" stroke-opacity="{o}" stroke-width="2"/>'
                              for r, o in ((40, .6), (70, .4), (100, .2)))),
    "rustwraith": ("hands", lambda g: hands_tell(g, "pair", size=66, curl=0.1)),
    "benchling": ("hands", lambda g: hands_tell(g, "one", size=60, curl=0.5)),
    "lamplanky": ("hands", lambda g: hands_tell(g, "reach", size=86, curl=0.3)),
    "graveshade": ("hands", lambda g: hands_tell(g, "pair", size=72, curl=0.45)),
    # smiles
    "smudge": ("smile", lambda g: f'<g filter="url(#wisp)" opacity=".85">{smile_tell(g, width=120, depth=34, teeth=10, sharp=False)}</g>'),
    "flicker": ("smile", lambda g: smile_tell(g, width=150, depth=40, teeth=12)
                + "".join(f'<rect x="{x}" y="{y}" width="{w}" height="4" fill="{g}" opacity=".5"/>' for x, y, w in ((60, 120, 40), (150, 150, 50), (100, 172, 30)))),
    "brimwarden": ("smile", lambda g: f'<ellipse cx="128" cy="80" rx="118" ry="20" fill="{BODY}" filter="url(#rim)"/>'
                   + f'<path d="M80 80q4-50 48-54q44 4 48 54z" fill="{BODY}" filter="url(#rim)"/>'
                   + smile_tell(g, width=110, depth=30, teeth=10)),
    "hollowchild": ("smile", lambda g: smile_tell(g, width=110, depth=40, teeth=8, sharp=False, eyes_too=True)),
    "hooded-choir": ("smile", lambda g: "".join(
        f'<g transform="translate({dx} {dy}) scale({s})">{smile_tell(g, width=110, depth=30, teeth=8, sharp=False)}</g>'
        for dx, dy, s in ((-10, 30, .55), (125, 30, .55), (32, -10, .75)))),
    "static-mother": ("smile", lambda g: smile_tell(g, width=180, depth=50, teeth=16, tilt=-4)
                      + "".join(f'<path d="M{x} {y}l8 12l-6 4l10 16" fill="none" stroke="{g}" stroke-width="2.4" filter="url(#glow)"/>'
                                for x, y in ((30, 60), (210, 50), (40, 190), (200, 180)))),
    "duskcrown": ("smile", lambda g: "".join(f'<path d="M{128 + dx - 8} 64l8 -{h}l8 {h}z" fill="{g}" filter="url(#glow)"/>'
                                            for dx, h in ((-36, 18), (-18, 30), (0, 42), (18, 30), (36, 18)))
                  + smile_tell(g, width=170, depth=50, teeth=14)),
}


def main():
    os.makedirs(OUT, exist_ok=True)
    src = open(os.path.join(ROOT, "src", "content", "shadows.ts")).read()
    glows = dict(re.findall(r"id: '([^']+)',[\s\S]*?glow: '(#[0-9a-fA-F]{6})'", src))
    missing = set(glows) - set(TELLS)
    assert not missing, missing
    for i, (sid, (_, fn)) in enumerate(TELLS.items()):
        with open(os.path.join(OUT, f"{sid}.svg"), "w") as fh:
            fh.write(wrap(sid, glows[sid], fn(glows[sid]), seed=i + 1))
    counts = {}
    for k, _ in TELLS.values():
        counts[k] = counts.get(k, 0) + 1
    print(f"wrote {len(TELLS)} tells", counts)


if __name__ == "__main__":
    main()
