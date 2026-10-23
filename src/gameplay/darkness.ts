// Reads a camera frame and decides whether the reticle (frame centre) is
// pointed into a real dark hiding spot: a patch much darker than the rest of
// the scene. A covered lens or a pitch-black room has no contrast, so it
// doesn't count.

export const SAMPLE_W = 64;
export const SAMPLE_H = 48;

export type DarkReading =
  | { kind: 'dark'; strength: number } // 0..1, how convincingly dark
  | { kind: 'too-bright' }
  | { kind: 'no-contrast' }; // everything is dark (covered lens, lights off)

export function readDarkness(pixels: Uint8ClampedArray): DarkReading {
  const lum = new Float32Array(SAMPLE_W * SAMPLE_H);
  for (let i = 0; i < lum.length; i++) {
    const p = i * 4;
    lum[i] = 0.2126 * pixels[p] + 0.7152 * pixels[p + 1] + 0.0722 * pixels[p + 2];
  }

  // Centre box: middle 30% of the frame.
  const x0 = Math.floor(SAMPLE_W * 0.35), x1 = Math.ceil(SAMPLE_W * 0.65);
  const y0 = Math.floor(SAMPLE_H * 0.35), y1 = Math.ceil(SAMPLE_H * 0.65);
  let sum = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { sum += lum[y * SAMPLE_W + x]; n++; }
  const centre = sum / n;

  const sorted = Array.from(lum).sort((a, b) => a - b);
  const bright = sorted[Math.floor(sorted.length * 0.9)];

  if (bright - centre < 35) return centre < 60 ? { kind: 'no-contrast' } : { kind: 'too-bright' };
  if (centre > 70) return { kind: 'too-bright' };
  // Darker centre and more contrast give a stronger reading.
  const strength = Math.min(1, ((70 - centre) / 50) * 0.6 + Math.min(1, (bright - centre) / 120) * 0.6);
  return { kind: 'dark', strength: Math.max(0.25, strength) };
}
