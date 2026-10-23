import { readDarkness, SAMPLE_H, SAMPLE_W, type DarkReading } from './darkness';
import { openEncounter, type EncounterResult } from './encounter';
import type { Spawn } from './spawning';

// Camera access is owned by core (src/core/camera.ts). Loaded optionally so
// gameplay still builds and falls back to the dark scene without it.
interface CameraHandle {
  video: HTMLVideoElement;
  stop(): void;
}
const cameraLoaders = import.meta.glob<{ startCamera(): Promise<CameraHandle | null> }>('../core/camera.ts');

async function startCamera(): Promise<CameraHandle | null> {
  const load = Object.values(cameraLoaders)[0];
  if (!load) return null;
  try {
    return await (await load()).startCamera();
  } catch (err) {
    console.warn('Camera unavailable, using fallback scene', err);
    return null;
  }
}

/**
 * Hunt a spawn: search dark spots with the camera until the shadow emerges,
 * then throw orbs at it over the live feed. Without a camera, goes straight
 * to the classic dark-scene encounter.
 */
export async function huntSpawn(spawn: Spawn): Promise<EncounterResult> {
  const cam = await startCamera();
  if (!cam) return openEncounter(spawn);
  try {
    const found = await searchWithCamera(spawn, cam.video);
    if (!found) return 'ran';
    return await openEncounter(spawn, {
      video: cam.video,
      anchor: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    });
  } finally {
    cam.stop();
  }
}

const SAMPLE_MS = 100;

/** Seconds of holding on a convincingly dark spot before the shadow emerges. */
function holdSeconds(spawn: Spawn): number {
  return 1.5 + (spawn.shadow.stats.stealth / 100) * 2.5;
}

const STATUS: Record<DarkReading['kind'], string> = {
  dark: 'Something stirs in there… hold steady',
  'too-bright': 'Too bright. Aim into a dark gap.',
  'no-contrast': "Too dark everywhere. Don't cover the lens; aim at a dark gap with some light around it.",
};

function searchWithCamera(spawn: Spawn, video: HTMLVideoElement): Promise<boolean> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'sz-search';
    root.style.setProperty('--glow', spawn.shadow.glow);
    video.classList.add('sz-camera-video');
    root.innerHTML = `
      <div class="sz-search-top">
        <button class="sz-enc-run" aria-label="Stop searching">Run</button>
        <div class="sz-search-hint">
          <div class="sz-search-where">Something is hiding ${escapeHtml(spawn.hidingSpot.where)}</div>
          <div class="sz-search-tip">${escapeHtml(spawn.hidingSpot.tip)}</div>
        </div>
      </div>
      <div class="sz-reticle"><div class="sz-reticle-eyes"><i></i><i></i></div></div>
      <div class="sz-search-bottom">
        <div class="sz-search-status">Point your camera into dark spots</div>
        <div class="sz-meter"><div class="sz-meter-fill"></div></div>
      </div>`;
    root.prepend(video);
    document.body.appendChild(root);
    video.play().catch(() => {});

    const sample = document.createElement('canvas');
    sample.width = SAMPLE_W;
    sample.height = SAMPLE_H;
    const sctx = sample.getContext('2d', { willReadFrequently: true })!;
    const status = root.querySelector<HTMLElement>('.sz-search-status')!;
    const fill = root.querySelector<HTMLElement>('.sz-meter-fill')!;
    const reticle = root.querySelector<HTMLElement>('.sz-reticle')!;
    const need = holdSeconds(spawn);
    let progress = 0;
    let last = performance.now();
    let done = false;

    const finish = (found: boolean) => {
      if (done) return;
      done = true;
      clearInterval(timer);
      root.remove();
      resolve(found);
    };
    root.querySelector<HTMLButtonElement>('.sz-enc-run')!.onclick = () => finish(false);

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.3, (now - last) / 1000);
      last = now;
      if (!video.videoWidth) return;
      sctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
      const reading = readDarkness(sctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data);
      if (reading.kind === 'dark') progress += (dt * reading.strength) / need;
      else progress -= dt * 0.35;
      progress = Math.max(0, Math.min(1, progress));
      status.textContent = progress > 0 && reading.kind !== 'dark' ? 'Lost it… find the dark again' : STATUS[reading.kind];
      fill.style.width = `${Math.round(progress * 100)}%`;
      reticle.style.setProperty('--p', progress.toFixed(2));
      reticle.classList.toggle('sz-locked', reading.kind === 'dark');
      if (progress >= 1) {
        try { navigator.vibrate?.([80, 40, 160]); } catch { /* unsupported */ }
        root.classList.add('sz-emerge');
        clearInterval(timer);
        setTimeout(() => finish(true), 600);
      }
    };
    const timer = window.setInterval(tick, SAMPLE_MS);
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
