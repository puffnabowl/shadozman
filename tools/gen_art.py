"""Generates the Shadozman shadow portraits and app icon as standalone SVGs.

Run: python3 tools/gen_art.py   (writes public/shadows/*.svg and public/icons/icon.svg)
"""
import math
import os
import random
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "shadows")
ICON_OUT = os.path.join(ROOT, "public", "icons")

BODY = "#0a0910"
PROP = "#1b1924"
PROP_EDGE = "#2c2838"


def f(n):
    return f"{n:.1f}".rstrip("0").rstrip(".")


# ── Shapes ──────────────────────────────────────────────────────────────


def tendril_hem(x0, x1, y, n, depth, rnd):
    """Points along a ragged, wispy hem from x0 to x1."""
    pts = []
    for i in range(1, n * 2):
        x = x0 + (x1 - x0) * i / (n * 2)
        dy = depth * (0.6 + 0.4 * rnd.random()) if i % 2 else -depth * 0.25
        pts.append((x, y + dy))
    return pts


def figure(cx, top, h, sw, head_r, arm=0.5, splay=0, hem=None, tendrils=4,
           head_ry=None, seed=1, hunch=0, arms=True, neck=0.9):
    """A standing humanoid silhouette path + head ellipse."""
    rnd = random.Random(seed)
    hw = sw / 2
    hem = hw * 0.75 if hem is None else hem
    head_ry = head_r * 1.12 if head_ry is None else head_ry
    hcy = top + head_ry
    neck_y = hcy + head_ry * neck
    sh_y = neck_y + head_r * 0.45
    bottom = top + h
    hand_y = sh_y + h * arm
    hx = cx + hunch
    d = [f"M{f(hx - head_r * 0.42)},{f(neck_y)}"]
    d.append(f"Q{f(cx - hw * 0.7)},{f(sh_y - 3)} {f(cx - hw)},{f(sh_y + 7)}")
    if arms:
        d.append(f"L{f(cx - hw - splay - 3)},{f(hand_y - 6)}")
        d.append(f"Q{f(cx - hw - splay - 4)},{f(hand_y + 8)} {f(cx - hw - splay + 2)},{f(hand_y + 10)}")
        d.append(f"L{f(cx - hw - splay + 5)},{f(hand_y - 2)}")
        d.append(f"L{f(cx - hw + 7)},{f(sh_y + h * 0.16)}")
    d.append(f"Q{f(cx - hw * 0.8)},{f(bottom - h * 0.35)} {f(cx - hem)},{f(bottom - 6)}")
    for x, y in tendril_hem(cx - hem, cx + hem, bottom - 6, tendrils, 14, rnd):
        d.append(f"L{f(x)},{f(y)}")
    d.append(f"L{f(cx + hem)},{f(bottom - 6)}")
    d.append(f"Q{f(cx + hw * 0.8)},{f(bottom - h * 0.35)} {f(cx + hw - 7 if arms else cx + hw)},{f(sh_y + h * 0.16 if arms else sh_y + 7)}")
    if arms:
        d.append(f"L{f(cx + hw + splay - 5)},{f(hand_y - 2)}")
        d.append(f"L{f(cx + hw + splay - 2)},{f(hand_y + 10)}")
        d.append(f"Q{f(cx + hw + splay + 4)},{f(hand_y + 8)} {f(cx + hw + splay + 3)},{f(hand_y - 6)}")
        d.append(f"L{f(cx + hw)},{f(sh_y + 7)}")
    d.append(f"Q{f(cx + hw * 0.7)},{f(sh_y - 3)} {f(hx + head_r * 0.42)},{f(neck_y)}Z")
    body = f'<path d="{" ".join(d)}"/>'
    head = f'<ellipse cx="{f(hx)}" cy="{f(hcy)}" rx="{f(head_r)}" ry="{f(head_ry)}"/>'
    return body + head, (hx, hcy, head_r)


def eyes(cx, cy, gap, r=3.2, slant=0, shape="round"):
    out = []
    for side in (-1, 1):
        x = cx + side * gap / 2
        if shape == "slit":
            out.append(f'<ellipse cx="{f(x)}" cy="{f(cy)}" rx="{f(r * 1.6)}" ry="{f(r * 0.55)}" transform="rotate({f(side * slant)} {f(x)} {f(cy)})"/>')
        else:
            out.append(f'<circle cx="{f(x)}" cy="{f(cy)}" r="{f(r)}"/>')
    return "".join(out)


def svg(sid, glow, sil, eye, props_back="", props_front="", fx="", aura=(128, 140, 112),
        fade=(190, 240), seed=3, wisp=6, size=256, extra_defs=""):
    ax, ay, ar = aura
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="{size}" height="{size}">
<title>{sid}</title>
<defs>
<radialGradient id="aura" cx="{f(ax)}" cy="{f(ay)}" r="{f(ar)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="{glow}" stop-opacity="0.42"/>
<stop offset="0.55" stop-color="{glow}" stop-opacity="0.12"/>
<stop offset="1" stop-color="{glow}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="256" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="{BODY}"/>
<stop offset="{f(fade[0] / 256)}" stop-color="{BODY}" stop-opacity="0.97"/>
<stop offset="{f(fade[1] / 256)}" stop-color="{BODY}" stop-opacity="0"/>
</linearGradient>
<filter id="wisp" x="-20%" y="-20%" width="140%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="{seed}" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="{wisp}" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="rim" x="-20%" y="-20%" width="140%" height="140%">
<feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="d"/>
<feGaussianBlur in="d" stdDeviation="2.4" result="b"/>
<feFlood flood-color="{glow}" flood-opacity="0.55"/>
<feComposite in2="b" operator="in"/>
</filter>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
<feGaussianBlur stdDeviation="2.6" result="b"/>
<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="haze" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
<g id="sil" fill="url(#body)">{sil}</g>
{extra_defs}
</defs>
<circle cx="{f(ax)}" cy="{f(ay)}" r="{f(ar)}" fill="url(#aura)"/>
{props_back}
<g filter="url(#wisp)">
<use href="#sil" filter="url(#rim)"/>
<use href="#sil"/>
</g>
{props_front}
<g fill="{glow}" filter="url(#glow)">{eye}</g>
{fx}
</svg>
"""


# ── Roster art ──────────────────────────────────────────────────────────

ART = {}


def art(fn):
    ART[fn.__name__.replace("_", "-")] = fn
    return fn


@art
def lurkling(g):
    sil, (hx, hy, r) = figure(150, 120, 110, 48, 22, arm=0.32, tendrils=3, seed=11)
    wall = (f'<rect x="78" y="40" width="70" height="200" fill="{PROP}"/>'
            f'<rect x="146" y="40" width="3" height="200" fill="{PROP_EDGE}"/>')
    # the wall hides the left half; the curled fingers grip its edge
    fingers = "".join(f'<rect x="141" y="{y}" width="12" height="5" rx="2.5" fill="{BODY}"/>' for y in (168, 175, 182))
    return svg("Lurkling", g, sil, eyes(hx + 2, hy + 2, 15, 3.8),
               props_front=wall + fingers, aura=(150, 150, 100), seed=11)


@art
def hallwalker(g):
    sil, (hx, hy, r) = figure(128, 58, 178, 62, 17, arm=0.45, tendrils=4, seed=12)
    door = (f'<path d="M70 236V34h116v202" fill="none" stroke="{PROP_EDGE}" stroke-width="8"/>'
            f'<path d="M78 236V42h100v194z" fill="#120f1a"/>')
    return svg("Hallwalker", g, sil, eyes(hx, hy + 2, 12, 2.6), props_back=door,
               aura=(128, 120, 110), seed=12)


@art
def flicker(g):
    sil, (hx, hy, r) = figure(140, 74, 160, 56, 17, arm=0.48, splay=4, tendrils=5, seed=13)
    beam = ('<defs><linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{g}" stop-opacity="0.45"/><stop offset="1" stop-color="{g}" stop-opacity="0"/>'
            '</linearGradient></defs>'
            '<path d="M60 40L28 236h120L84 40z" fill="url(#cone)"/>'
            f'<path d="M66 236V30q0-10 10-10h22" fill="none" stroke="{PROP_EDGE}" stroke-width="6"/>'
            f'<rect x="88" y="16" width="26" height="10" rx="3" fill="{PROP_EDGE}"/>'
            f'<rect x="92" y="25" width="18" height="4" fill="{g}" opacity=".8"/>')
    # scanline glitch bars cut through the body
    glitch = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="3" fill="{g}" opacity=".35"/>'
                     for x, y, w in ((104, 112, 22), (150, 140, 30), (118, 176, 18), (138, 98, 14)))
    return svg("Flicker", g, sil, eyes(hx, hy + 2, 12, 2.6), props_back=beam, fx=glitch,
               aura=(140, 140, 100), seed=13, wisp=10)


@art
def smudge(g):
    sil, (hx, hy, r) = figure(128, 70, 150, 70, 22, arm=0.4, tendrils=3, seed=14)
    frame = (f'<rect x="34" y="34" width="188" height="188" rx="10" fill="none" stroke="{PROP_EDGE}" stroke-width="3" stroke-dasharray="26 136"/>')
    return (svg("Smudge", g, f'<g filter="url(#haze)">{sil}</g>',
                f'<circle cx="{f(hx + 6)}" cy="{f(hy)}" r="4"/>', props_back=frame,
                aura=(128, 130, 100), seed=14, wisp=14, fade=(150, 230)))


@art
def stairbottom(g):
    # crouched: a squat body with knees up and arms wrapped around them
    sil = ('<path d="M96 222q-8-46 14-72q14-14 34-12q26 4 30 34q4 26-6 50l-10 4l-8-8l-8 10l-10-8l-10 10l-10-8z"/>'
           '<path d="M100 186q10-28 40-30q24 0 32 20l-6 6q-10-14-26-14q-22 2-34 22z"/>'
           '<ellipse cx="128" cy="132" rx="22" ry="24"/>')
    steps = "".join(f'<rect x="{30 + i * 34}" y="{226 - i * 26}" width="{226 - 30 - i * 34}" height="26" fill="{PROP if i % 2 else "#16141e"}"/>'
                    for i in range(1, 6))
    steps += f'<rect x="0" y="226" width="256" height="30" fill="#16141e"/>'
    return svg("Stairbottom", g, sil, eyes(128, 136, 14, 3, slant=12, shape="slit"),
               props_back=steps, aura=(128, 170, 90), seed=15, fade=(220, 256))


@art
def puddlegaunt(g):
    # standing figure upside down, as a reflection, inside a puddle
    sil, (hx, hy, r) = figure(128, 80, 140, 40, 14, arm=0.5, tendrils=3, seed=16)
    puddle = (f'<ellipse cx="128" cy="150" rx="104" ry="62" fill="{g}" fill-opacity=".22"/>'
              f'<ellipse cx="128" cy="150" rx="104" ry="62" fill="none" stroke="{g}" stroke-opacity=".3" stroke-width="2"/>')
    ripples = "".join(f'<ellipse cx="128" cy="150" rx="{rx}" ry="{rx * 0.5}" fill="none" stroke="{g}" stroke-opacity="{op}" stroke-width="1.5"/>'
                      for rx, op in ((40, .25), (66, .18), (88, .12)))
    s = svg("Puddlegaunt", g, f'<g transform="translate(0 300) scale(1 -1)">{sil}</g>',
            eyes(hx, 300 - hy - 2, 11, 2.6), props_back=puddle, fx=ripples,
            aura=(128, 150, 96), seed=16, fade=(256, 256))
    # clip the reflection to the puddle
    return s.replace('<g filter="url(#wisp)">', '<clipPath id="pc"><ellipse cx="128" cy="150" rx="102" ry="60"/></clipPath><g clip-path="url(#pc)"><g filter="url(#wisp)">', 1) \
            .replace('</g>\n\n<g fill=', '</g></g>\n\n<g fill=', 1)


@art
def brimwarden(g):
    sil, (hx, hy, r) = figure(128, 56, 184, 60, 15, arm=0.5, hem=46, tendrils=5, seed=17)
    hat = (f'<ellipse cx="{f(hx)}" cy="{f(hy - 6)}" rx="40" ry="7"/>'
           f'<path d="M{f(hx - 17)} {f(hy - 6)}q2-26 17-28q15 2 17 28z"/>')
    return svg("Brimwarden", g, sil + hat, eyes(hx, hy + 6, 11, 2.4, slant=8, shape="slit"),
               aura=(128, 130, 112), seed=17)


@art
def sleepsitter(g):
    # hunched perched figure with long dangling arms, at the foot of a bed
    sil = ('<path d="M92 176q-6-40 16-70q16-20 40-16q30 8 30 44q0 26-10 42l-6 40l-6-36l-8 2l-6-4l-8 4l-8-4l-8 4l-8-4l-6 38z"/>'
           '<path d="M100 120q-24 30-26 92l6 2q6-50 30-80z"/>'
           '<path d="M166 120q20 34 22 92l-6 2q-6-54-24-82z"/>'
           '<ellipse cx="124" cy="96" rx="22" ry="20"/>'
           '<path d="M108 82l-6-20l14 14zM140 82l8-20l-2 22z"/>')
    bed = (f'<rect x="20" y="176" width="216" height="36" rx="6" fill="{PROP}"/>'
           f'<rect x="20" y="170" width="216" height="10" rx="5" fill="{PROP_EDGE}"/>'
           f'<rect x="24" y="212" width="10" height="28" fill="{PROP}"/><rect x="222" y="212" width="10" height="28" fill="{PROP}"/>')
    return svg("Sleepsitter", g, sil, eyes(124, 98, 16, 4), props_back=bed,
               aura=(128, 120, 110), seed=18, fade=(230, 256))


@art
def pinewatch(g):
    def trunk(x, w, c, lean=0):
        return f'<path d="M{x - w / 2} 240L{x - w / 2 + lean} 0h{w}L{x + w / 2} 240z" fill="{c}"/>'
    back = trunk(40, 16, "#151320", 3) + trunk(92, 12, "#151320", -2) + trunk(214, 18, "#151320", -3)
    sil, (hx, hy, r) = figure(150, 40, 196, 30, 12, arm=0.62, tendrils=3, seed=19)
    front = trunk(66, 26, PROP, -4) + trunk(196, 30, PROP, 4) + trunk(118, 20, PROP, 2)
    canopy = f'<path d="M0 0h256v30q-30 14-64 4q-34 18-70 2q-36 16-72 2q-30 10-50-2z" fill="{PROP}"/>'
    return svg("Pinewatch", g, sil, eyes(hx, hy + 2, 8, 2.2), props_back=back,
               props_front=front + canopy, aura=(150, 80, 90), seed=19)


@art
def rustwraith(g):
    sil, (hx, hy, r) = figure(128, 62, 170, 70, 16, arm=0.46, splay=6, tendrils=4, seed=20)
    helmet = f'<path d="M{f(hx - 20)} {f(hy - 2)}q0-24 20-24t20 24z"/><rect x="{f(hx - 24)}" y="{f(hy - 4)}" width="48" height="6" rx="2"/>'
    pipes = (f'<path d="M0 70h256M0 84h256" stroke="{PROP_EDGE}" stroke-width="9"/>'
             f'<path d="M30 70v170M226 84v156" stroke="{PROP}" stroke-width="12"/>'
             f'<circle cx="30" cy="70" r="9" fill="{PROP_EDGE}"/><circle cx="226" cy="84" r="9" fill="{PROP_EDGE}"/>')
    sparks = "".join(f'<circle cx="{x}" cy="{y}" r="{r_}" fill="{g}"/>' for x, y, r_ in ((70, 160, 1.6), (186, 126, 1.4), (176, 196, 1.2), (60, 110, 1.1)))
    return svg("Rustwraith", g, sil + helmet, eyes(hx, hy + 4, 12, 3, shape="slit"),
               props_back=pipes, fx=f'<g filter="url(#glow)">{sparks}</g>', aura=(128, 140, 110), seed=20)


@art
def benchling(g):
    # small seated figure on a bench, legs dangling
    sil = ('<path d="M108 168q-6-36 20-42q26 6 20 42l2 22h-8v26l-6-4v-22h-16v22l-6 4v-26h-8z"/>'
           '<ellipse cx="128" cy="112" rx="16" ry="17"/>')
    bench = (f'<rect x="40" y="150" width="176" height="8" rx="3" fill="{PROP_EDGE}"/>'
             f'<rect x="40" y="132" width="176" height="8" rx="3" fill="{PROP_EDGE}"/>')
    seat = (f'<rect x="34" y="186" width="188" height="10" rx="3" fill="{PROP}"/>'
            f'<rect x="50" y="196" width="8" height="40" fill="{PROP}"/><rect x="198" y="196" width="8" height="40" fill="{PROP}"/>'
            f'<rect x="118" y="160" width="20" height="5" rx="1" fill="{g}" opacity=".55"/>')
    return svg("Benchling", g, sil, eyes(128, 114, 10, 2.4), props_back=bench,
               props_front=seat, aura=(128, 150, 90), seed=21, fade=(230, 256))


@art
def lamplanky(g):
    sil, (hx, hy, r) = figure(150, 22, 216, 40, 12, arm=0.62, splay=2, tendrils=3, seed=22, hunch=-8, head_ry=15)
    lamp = (f'<path d="M64 240V30q0-8 8-8h18" fill="none" stroke="{PROP_EDGE}" stroke-width="6"/>'
            f'<path d="M84 18h20l-4 10h-12z" fill="{PROP_EDGE}"/>'
            f'<ellipse cx="94" cy="30" rx="8" ry="3" fill="{g}"/>')
    return svg("Lamplanky", g, sil, eyes(hx, hy + 2, 9, 2.2), props_back=lamp,
               aura=(110, 70, 110), seed=22)


@art
def graveshade(g):
    sil, (hx, hy, r) = figure(128, 46, 150, 62, 18, arm=0.42, splay=10, tendrils=4, seed=23)
    stone = (f'<path d="M84 240v-74q0-36 44-36t44 36v74z" fill="{PROP}"/>'
             f'<path d="M84 240v-74q0-36 44-36t44 36v74" fill="none" stroke="{PROP_EDGE}" stroke-width="3"/>'
             f'<path d="M106 176h44M110 190h36M114 204h28" stroke="{PROP_EDGE}" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 5"/>'
             f'<rect x="20" y="236" width="216" height="20" fill="#16141e"/>')
    mist = f'<ellipse cx="128" cy="236" rx="110" ry="14" fill="{g}" opacity=".18" filter="url(#haze)"/>'
    return svg("Graveshade", g, sil, eyes(hx, hy + 2, 13, 3), props_front=stone + mist,
               aura=(128, 110, 110), seed=23)


@art
def ferrymute(g):
    # hooded figure standing in a low boat, holding a pole
    sil = ('<path d="M108 202q-4-70 8-104q4-30 26-30q22 6 22 34q10 40 6 100z"/>'
           '<path d="M118 74q4-24 26-22q20 6 18 32l-10 16q-6-18-18-18q-8 2-12 14z"/>')
    pole = f'<path d="M172 30L148 236" stroke="{PROP_EDGE}" stroke-width="5" stroke-linecap="round"/>'
    hand = f'<ellipse cx="164" cy="120" rx="7" ry="9" fill="{BODY}"/>'
    boat = (f'<path d="M40 196h176q-10 28-44 30h-88q-34-2-44-30z" fill="{PROP}"/>'
            f'<path d="M40 196h176" stroke="{PROP_EDGE}" stroke-width="4"/>')
    water = "".join(f'<path d="M{x} {y}q14-6 28 0t28 0" fill="none" stroke="{g}" stroke-opacity=".35" stroke-width="2"/>'
                    for x, y in ((20, 236), (120, 242), (176, 232), (60, 248)))
    fog = f'<rect x="0" y="200" width="256" height="40" fill="{g}" opacity=".12" filter="url(#haze)"/>'
    return svg("Ferrymute", g, sil, eyes(140, 90, 10, 2.2), props_back=pole,
               props_front=hand + boat + water + fog, aura=(140, 130, 110), seed=24, fade=(256, 256))


@art
def hollowchild(g):
    sil, (hx, hy, r) = figure(118, 104, 124, 40, 17, arm=0.34, tendrils=3, seed=25)
    defs = f'<mask id="hole"><rect width="256" height="256" fill="#fff"/><circle cx="{f(hx)}" cy="{f(hy + 52)}" r="9" fill="#000"/></mask>'
    s = svg("Hollowchild", g, f'<g mask="url(#hole)">{sil}</g>', eyes(hx, hy + 2, 12, 3),
            extra_defs=defs, aura=(128, 150, 100), seed=25,
            fx=(f'<circle cx="{f(hx)}" cy="{f(hy + 52)}" r="6" fill="{g}" filter="url(#glow)"/>'
                f'<path d="M{f(hx + 22)} {f(hy + 66)}Q{f(hx + 40)} {f(hy)} {f(hx + 58)} {f(hy - 50)}" fill="none" stroke="{PROP_EDGE}" stroke-width="2"/>'))
    return s


@art
def hooded_choir(g):
    def hooded(cx, top, h, w, seed):
        rnd = random.Random(seed)
        hem = "".join(f"L{f(x)},{f(y)}" for x, y in tendril_hem(cx - w * 0.55, cx + w * 0.55, top + h, 4, 12, rnd))
        return (f'<path d="M{f(cx)} {f(top)}q{f(w * 0.42)} 4 {f(w * 0.46)} {f(w * 0.6)}q{f(w * 0.1)} {f(h * 0.4)} {f(w * 0.09)} {f(h - w * 0.6)}'
                f'{hem}L{f(cx - w * 0.55)},{f(top + h)}q{f(-w * 0.01)} {f(-(h - w * 0.6))} {f(w * 0.09)} {f(-(h - w * 0.6))}'
                f'q{f(w * 0.04)} {f(-w * 0.56)} {f(w * 0.46)} {f(-w * 0.6)}z"/>')
    sil = hooded(70, 82, 150, 64, 1) + hooded(186, 82, 150, 64, 2) + hooded(128, 50, 186, 76, 3)
    faces = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#000"/>'
                    for x, y, rx, ry in ((70, 112, 15, 18), (186, 112, 15, 18), (128, 86, 18, 22)))
    mouths = "".join(f'<ellipse cx="{x}" cy="{y}" rx="4" ry="2.6"/>' for x, y in ((70, 120), (186, 120), (128, 96)))
    eye = eyes(70, 108, 12, 2.2) + eyes(186, 108, 12, 2.2) + eyes(128, 80, 14, 2.6) + mouths
    notes = "".join(f'<path d="M{x} {y}q8-10 16 0t16 0" fill="none" stroke="{g}" stroke-opacity=".4" stroke-width="1.5"/>'
                    for x, y in ((100, 36), (150, 26), (40, 60), (190, 54)))
    return svg("Hooded Choir", g, sil, eye, props_front=faces, fx=notes,
               aura=(128, 120, 124), seed=26)


@art
def mirrorkin(g):
    sil, (hx, hy, r) = figure(76, 74, 162, 50, 15, arm=0.46, tendrils=3, seed=27)
    frame = (f'<ellipse cx="170" cy="138" rx="62" ry="96" fill="#14121c"/>'
             f'<ellipse cx="170" cy="138" rx="62" ry="96" fill="none" stroke="{PROP_EDGE}" stroke-width="8"/>'
             f'<ellipse cx="170" cy="138" rx="54" ry="88" fill="none" stroke="{g}" stroke-opacity=".25" stroke-width="1.5"/>')
    twin, _ = figure(170, 74, 162, 50, 15, arm=0.46, tendrils=3, seed=28)
    twin_g = (f'<clipPath id="mc"><ellipse cx="170" cy="138" rx="54" ry="88"/></clipPath>'
              f'<g clip-path="url(#mc)" fill="url(#body)" opacity=".85" transform="translate(340 0) scale(-1 1)">'
              f'<g transform="translate(170 0)">{twin.replace("170", "0")}</g></g>')
    # simpler & robust: draw the twin at x=170 directly
    twin_g = f'<clipPath id="mc"><ellipse cx="170" cy="138" rx="54" ry="88"/></clipPath><g clip-path="url(#mc)" fill="url(#body)" opacity=".9">{twin}</g>'
    glint = f'<path d="M136 70q-10 30-4 70" stroke="#fff" stroke-opacity=".12" stroke-width="5" fill="none" stroke-linecap="round"/>'
    return svg("Mirrorkin", g, sil, eyes(hx, hy + 2, 10, 2.4) + eyes(170, hy + 2, 10, 2.4),
               props_back=frame + twin_g + glint, aura=(124, 140, 120), seed=27)


@art
def static_mother(g):
    sil, (hx, hy, r) = figure(128, 70, 166, 56, 16, arm=0.5, splay=12, hem=40, tendrils=5, seed=29)
    rnd = random.Random(29)
    hair = []
    for i in range(16):
        a = math.pi * (0.92 + 1.16 * i / 15)
        x, y = hx, hy
        pts = [f"M{f(x)} {f(y)}"]
        for step in range(5):
            x += math.cos(a) * 11 + rnd.uniform(-5, 5)
            y += math.sin(a) * 11 + rnd.uniform(-5, 5)
            pts.append(f"L{f(x)} {f(y)}")
        hair.append(f'<path d="{" ".join(pts)}" fill="none" stroke="{BODY}" stroke-width="{f(3.6 - i % 3)}" stroke-linejoin="bevel"/>')
    wires = (f'<path d="M0 46q128 40 256 0M0 66q128 40 256 0" fill="none" stroke="{PROP_EDGE}" stroke-width="3"/>'
             f'<path d="M20 30v210M236 30v210M8 40h24M224 40h24" stroke="{PROP}" stroke-width="7"/>')
    sparks = "".join(f'<path d="M{x} {y}l4 6l-3 2l5 8" fill="none" stroke="{g}" stroke-width="1.6"/>'
                     for x, y in ((60, 92), (184, 84), (98, 54), (200, 140), (44, 150)))
    return svg("Static Mother", g, sil + "".join(hair), eyes(hx, hy + 2, 12, 2.8),
               props_back=wires, fx=f'<g filter="url(#glow)">{sparks}</g>', aura=(128, 110, 120), seed=29, wisp=8)


@art
def the_unlit(g):
    rnd = random.Random(30)
    mass = ('<path d="M-10 266Q-10 120 40 70Q90 14 128 12Q170 14 216 70Q266 120 266 266z"/>'
            '<path d="M20 120q-30-40-10-90q20 30 40 46zM236 120q30-40 10-90q-20 30-40 46z"/>')
    eye = []
    for _ in range(22):
        x, y = rnd.uniform(40, 216), rnd.uniform(60, 220)
        s_ = rnd.uniform(1.2, 3.4)
        eye.append(eyes(x, y, s_ * 4.2, s_))
    big = f'<ellipse cx="128" cy="120" rx="22" ry="7"/><circle cx="128" cy="120" r="4" fill="#000"/>'
    stars = "".join(f'<circle cx="{f(rnd.uniform(0, 256))}" cy="{f(rnd.uniform(0, 256))}" r="{f(rnd.uniform(.4, 1.2))}" fill="#fff" opacity="{f(rnd.uniform(.2, .6))}"/>'
                    for _ in range(40))
    return svg("The Unlit", g, mass, "".join(eye) + big, props_back=stars,
               aura=(128, 128, 140), seed=30, wisp=12, fade=(256, 256))


@art
def duskcrown(g):
    sun = (f'<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
           f'<stop offset="0" stop-color="{g}" stop-opacity="0"/><stop offset="1" stop-color="{g}" stop-opacity=".55"/></linearGradient></defs>'
           f'<path d="M28 236a100 100 0 0 1 200 0z" fill="url(#sky)"/>'
           f'<path d="M28 236a100 100 0 0 1 200 0" fill="none" stroke="{g}" stroke-opacity=".5" stroke-width="2"/>'
           f'<rect x="0" y="234" width="256" height="22" fill="#16141e"/>')
    sil, (hx, hy, r) = figure(128, 58, 178, 64, 17, arm=0.52, hem=70, tendrils=6, seed=31)
    cape = '<path d="M96 110Q60 180 40 240h176Q196 180 160 110z"/>'
    crown = "".join(f'<path d="M{f(hx + dx - 4)} {f(hy - 14)}l4 -{h_}l4 {h_}z"/>' for dx, h_ in ((-16, 14), (-8, 22), (0, 30), (8, 22), (16, 14)))
    crown += f'<rect x="{f(hx - 20)}" y="{f(hy - 16)}" width="40" height="6" rx="2"/>'
    return svg("Duskcrown", g, cape + sil + crown, eyes(hx, hy + 3, 12, 3, slant=-10, shape="slit"),
               props_back=sun, aura=(128, 130, 120), seed=31, fade=(236, 256))


# ── App icon ────────────────────────────────────────────────────────────


def icon(maskable=False):
    pad = 0 if maskable else 0
    r = 0 if maskable else 56
    sil, (hx, hy, hr) = figure(128, 54, 188, 66, 21, arm=0.42, tendrils=4, seed=40)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512">
<title>Shadozman</title>
<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="70%">
<stop offset="0" stop-color="#2a1d4a"/><stop offset=".6" stop-color="#120d22"/><stop offset="1" stop-color="#07060c"/>
</radialGradient>
<radialGradient id="moon" cx="50%" cy="50%" r="50%">
<stop offset="0" stop-color="#c9b8ff" stop-opacity=".9"/><stop offset=".7" stop-color="#8a6bff" stop-opacity=".35"/><stop offset="1" stop-color="#8a6bff" stop-opacity="0"/>
</radialGradient>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/><feMerge><feMergeNode/><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="wisp" x="-20%" y="-20%" width="140%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<clipPath id="c"><rect width="256" height="256" rx="{r}"/></clipPath>
</defs>
<g clip-path="url(#c)">
<rect width="256" height="256" fill="url(#bg)"/>
<circle cx="128" cy="100" r="86" fill="url(#moon)"/>
<circle cx="128" cy="100" r="52" fill="#d9ccff" opacity=".85"/>
<circle cx="146" cy="88" r="46" fill="#2a1d4a" opacity=".55"/>
<g fill="{BODY}" filter="url(#wisp)">{sil}</g>
<g fill="#b28bff" filter="url(#glow)">{eyes(hx, hy + 3, 15, 4.2)}</g>
</g>
</svg>
"""


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(ICON_OUT, exist_ok=True)
    import json
    src = open(os.path.join(ROOT, "src", "content", "shadows.ts")).read()
    glows = dict(re.findall(r"id: '([^']+)',[\s\S]*?glow: '(#[0-9a-fA-F]{6})'", src))
    for sid, fn in ART.items():
        with open(os.path.join(OUT, f"{sid}.svg"), "w") as fh:
            fh.write(fn(glows[sid]))
    missing = set(glows) - set(ART)
    assert not missing, missing
    with open(os.path.join(ICON_OUT, "icon.svg"), "w") as fh:
        fh.write(icon())
    with open(os.path.join(ICON_OUT, "icon-maskable.svg"), "w") as fh:
        fh.write(icon(maskable=True))
    print(f"wrote {len(ART)} portraits + icons")


if __name__ == "__main__":
    main()
