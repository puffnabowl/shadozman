import type { ShadowType } from '../content/types';
import { artUrl } from './art';
import { hashString } from './rng';

/** The part of a shadow you spot before you see the whole thing. */
export type Tell = 'eyes' | 'hands' | 'smile';
const TELLS: Tell[] = ['eyes', 'hands', 'smile'];

// `tell` and `tellArt` come from the content module once the art thread adds
// them; until then each species gets a stable tell from its id.
type WithTell = ShadowType & { tell?: string; tellArt?: string };

export function tellFor(shadow: ShadowType): Tell {
  const t = (shadow as WithTell).tell;
  if (t && (TELLS as string[]).includes(t)) return t as Tell;
  return TELLS[hashString(shadow.id) % TELLS.length];
}

/** Markup for the tell: the species' own tell art if it has one, else a built-in drawing. */
export function tellHtml(shadow: ShadowType): string {
  const art = (shadow as WithTell).tellArt;
  if (art) return `<img class="sz-tell-img" src="${artUrl(art)}" alt="">`;
  return tellSvg(tellFor(shadow), shadow.glow);
}

export function tellSvg(tell: Tell, color: string): string {
  const open = `<svg class="sz-tell sz-tell-${tell}" viewBox="0 0 100 100" aria-hidden="true">`;
  if (tell === 'eyes') {
    return `${open}<g class="sz-tell-blink" fill="${color}">
      <path d="M18 50 Q31 38 44 50 Q31 58 18 50 Z"/><path d="M56 50 Q69 38 82 50 Q69 58 56 50 Z"/></g>
      <g fill="#000"><ellipse cx="31" cy="49.5" rx="1.8" ry="5"/><ellipse cx="69" cy="49.5" rx="1.8" ry="5"/></g></svg>`;
  }
  if (tell === 'smile') {
    const teeth = [26, 34, 42, 50, 58, 66, 74]
      .map((x) => `<line x1="${x}" y1="${50 + Math.abs(50 - x) * -0.25}" x2="${x}" y2="${62 - Math.abs(50 - x) * 0.3}"/>`)
      .join('');
    return `${open}<path fill="${color}" d="M14 44 Q50 52 86 44 Q74 76 50 76 Q26 76 14 44 Z"/>
      <g stroke="#000" stroke-width="1.6" stroke-linecap="round">${teeth}</g>
      <path d="M17 47 Q50 62 83 47" fill="none" stroke="#000" stroke-width="1.6"/></svg>`;
  }
  // Hands: long fingers curling over an edge from both sides.
  const finger = (x: number, len: number, lean: number) =>
    `<path d="M${x} 78 C${x + lean * 0.3} ${78 - len * 0.6} ${x + lean} ${78 - len} ${x + lean + 4} ${78 - len + 6}"/>`;
  const hand = (x: number, dir: number) =>
    [0, 1, 2, 3].map((i) => finger(x + i * 6 * dir, 26 + (i === 1 || i === 2 ? 10 : 0), 4 * dir)).join('');
  return `${open}<g fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round">
    ${hand(14, 1)}${hand(86, -1)}</g>
    <g fill="#000" stroke="${color}" stroke-width="1.5"><ellipse cx="24" cy="84" rx="13" ry="8"/><ellipse cx="76" cy="84" rx="13" ry="8"/></g></svg>`;
}
