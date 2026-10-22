import type { ShadowType } from '../content/types';
import { addToCollection, markSpawnResolved } from './collection';
import type { Spawn } from './spawning';
import { artUrl } from './art';

export type EncounterResult = 'caught' | 'fled' | 'ran';

/**
 * Full-screen catch encounter. Swipe the light orb up at the shadow.
 * Throwing while the shrinking ring is small gives a bonus; a curved
 * (sideways) swipe that still lands gives a small extra bonus.
 */
export function openEncounter(spawn: Spawn): Promise<EncounterResult> {
  return new Promise((resolve) => {
    const enc = new Encounter(spawn, (r) => resolve(r));
    enc.start();
  });
}

type Phase = 'idle' | 'aiming' | 'flying' | 'capturing' | 'broke' | 'done';

interface Orb { x: number; y: number; vx: number; vy: number; r: number; spin: number }

const GRAVITY = 2600; // px/s^2, scaled by screen height
const MIN_THROW_SPEED = 600;

class Encounter {
  private root = document.createElement('div');
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d')!;
  private hud = document.createElement('div');
  private toast = document.createElement('div');
  private img = new Image();
  private imgOk = false;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private t = 0;
  private phase: Phase = 'idle';
  private orb: Orb = { x: 0, y: 0, vx: 0, vy: 0, r: 26, spin: 0 };
  private trail: { x: number; y: number; t: number }[] = [];
  private throws = 0;
  private ringPhase = 0;
  private lockedRing = 1;
  private curve = 0;
  private captureT = 0;
  private captureSuccess = false;
  private shakes = 0;
  private brokeT = 0;
  private shadow: ShadowType;

  constructor(private spawn: Spawn, private onDone: (r: EncounterResult) => void) {
    this.shadow = spawn.shadow;
  }

  start(): void {
    this.root.className = 'sz-encounter';
    this.root.style.setProperty('--glow', this.shadow.glow);
    this.hud.className = 'sz-enc-hud';
    this.hud.innerHTML = `
      <button class="sz-enc-run" aria-label="Run away">Run</button>
      <div class="sz-enc-title">
        <div class="sz-enc-name">${escapeHtml(this.shadow.name)}</div>
        <div class="sz-enc-sub">${escapeHtml(this.shadow.title)} · <span class="sz-rarity-${this.shadow.rarity}">${this.shadow.rarity}</span></div>
      </div>
      <div class="sz-enc-throws">Orbs thrown: <b>0</b></div>`;
    this.toast.className = 'sz-enc-toast';
    this.root.append(this.canvas, this.hud, this.toast);
    document.body.appendChild(this.root);

    this.hud.querySelector<HTMLButtonElement>('.sz-enc-run')!.onclick = () => this.finish('ran');
    this.img.onload = () => (this.imgOk = true);
    this.img.src = artUrl(this.shadow.art);

    this.resize();
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('pointerdown', this.onDown);
    this.canvas.addEventListener('pointermove', this.onMove);
    this.canvas.addEventListener('pointerup', this.onUp);
    this.canvas.addEventListener('pointercancel', this.onUp);
    this.resetOrb();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  // ---- layout -------------------------------------------------------------

  private resize = (): void => {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.phase === 'idle' || this.phase === 'aiming') this.resetOrb();
  };

  private get orbHome() { return { x: this.w / 2, y: this.h - 90 }; }
  private get shadowSize() { return Math.min(this.w * 0.55, this.h * 0.38); }

  /** Shadow drifts side to side; faster species drift faster. */
  private shadowPos(): { x: number; y: number } {
    const speed = 0.4 + (this.shadow.stats.speed / 100) * 1.4;
    const amp = this.w * 0.18 * (0.4 + this.shadow.stats.stealth / 160);
    return {
      x: this.w / 2 + Math.sin(this.t * speed) * amp,
      y: this.h * 0.36 + Math.sin(this.t * speed * 1.7) * 10,
    };
  }

  private ringScale(): number {
    // 1 → 0.2 then snaps back, about 1.6s per cycle.
    return 1 - 0.8 * ((this.ringPhase % 1.6) / 1.6);
  }

  private resetOrb(): void {
    const { x, y } = this.orbHome;
    this.orb = { x, y, vx: 0, vy: 0, r: 26, spin: 0 };
  }

  // ---- input --------------------------------------------------------------

  private onDown = (e: PointerEvent): void => {
    if (this.phase !== 'idle') return;
    const d = Math.hypot(e.clientX - this.orb.x, e.clientY - this.orb.y);
    if (d > this.orb.r * 2.5) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.phase = 'aiming';
    this.trail = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
  };

  private onMove = (e: PointerEvent): void => {
    if (this.phase !== 'aiming') return;
    this.orb.x = e.clientX;
    this.orb.y = e.clientY;
    this.trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (this.trail.length > 30) this.trail.shift();
  };

  private onUp = (e: PointerEvent): void => {
    if (this.phase !== 'aiming') return;
    const now = performance.now();
    this.trail.push({ x: e.clientX, y: e.clientY, t: now });
    // Velocity from the last ~90ms of the swipe.
    const recent = this.trail.filter((p) => now - p.t < 90);
    const a = recent[0] ?? this.trail[0];
    const b = this.trail[this.trail.length - 1];
    const dt = Math.max(0.016, (b.t - a.t) / 1000);
    const vx = (b.x - a.x) / dt;
    const vy = (b.y - a.y) / dt;
    if (-vy < MIN_THROW_SPEED) {
      // Too weak or not upward: put the orb back.
      this.phase = 'idle';
      this.resetOrb();
      return;
    }
    // Curve = how much the swipe path bowed sideways relative to its chord.
    this.curve = Math.min(1, Math.abs(pathBow(this.trail)) / 60);
    const scale = this.h / 800;
    this.orb.vx = vx * 0.9;
    this.orb.vy = Math.max(vy, -2600 * scale) * 1.0;
    this.orb.spin = this.curve > 0.3 ? Math.sign(pathBow(this.trail)) * 8 : 2;
    this.lockedRing = this.ringScale();
    this.throws++;
    this.hud.querySelector('.sz-enc-throws b')!.textContent = String(this.throws);
    this.phase = 'flying';
  };

  // ---- simulation ---------------------------------------------------------

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    if (this.phase !== 'capturing') this.ringPhase += dt;
    this.update(dt);
    this.draw();
    if (this.phase !== 'done') this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    if (this.phase === 'flying') {
      const g = GRAVITY * (this.h / 800);
      this.orb.vy += g * dt;
      this.orb.x += this.orb.vx * dt;
      this.orb.y += this.orb.vy * dt;
      // Orb shrinks as it travels "into" the scene.
      const travel = Math.max(0, this.orbHome.y - this.orb.y) / this.h;
      this.orb.r = 26 * (1 - Math.min(0.55, travel * 0.9));
      const sp = this.shadowPos();
      const hitR = this.shadowSize * 0.32;
      if (Math.hypot(this.orb.x - sp.x, this.orb.y - sp.y) < hitR) {
        this.onHit();
      } else if (this.orb.y > this.h + 60 || this.orb.x < -60 || this.orb.x > this.w + 60 || (this.orb.vy > 0 && this.orb.y > this.orbHome.y)) {
        this.showToast('Missed');
        this.phase = 'idle';
        this.resetOrb();
      }
    } else if (this.phase === 'capturing') {
      this.captureT += dt;
      // Up to three shakes at 0.8s each, then resolve.
      const shakeIdx = Math.floor(this.captureT / 0.8);
      if (shakeIdx > this.shakes) {
        this.shakes = shakeIdx;
        vibrate(30);
        const totalShakes = this.captureSuccess ? 3 : this.failShakes;
        if (this.shakes >= totalShakes) {
          if (this.captureSuccess) this.onCaught();
          else this.onBreakFree();
        }
      }
    } else if (this.phase === 'broke') {
      this.brokeT += dt;
      if (this.brokeT > 0.7) {
        if (Math.random() < this.shadow.fleeRate) this.onFled();
        else {
          this.phase = 'idle';
          this.resetOrb();
        }
      }
    }
  }

  private failShakes = 1;

  private onHit(): void {
    const ring = this.lockedRing;
    let mult = 1;
    let label = 'Hit';
    if (ring < 0.4) { mult = 1.9; label = 'Excellent!'; }
    else if (ring < 0.7) { mult = 1.5; label = 'Great!'; }
    else { mult = 1.15; label = 'Nice!'; }
    if (this.curve > 0.3) { mult *= 1.25; label += ' Curveball'; }
    const chance = catchChance(this.shadow.catchRate, mult);
    this.captureSuccess = Math.random() < chance;
    this.failShakes = this.captureSuccess ? 3 : 1 + Math.floor(Math.random() * 3);
    this.showToast(label);
    vibrate(50);
    this.phase = 'capturing';
    this.captureT = 0;
    this.shakes = 0;
    const sp = this.shadowPos();
    this.captureAt = { x: sp.x, y: sp.y + this.shadowSize * 0.25 };
  }

  private captureAt = { x: 0, y: 0 };

  private onBreakFree(): void {
    this.showToast('It broke free!');
    vibrate([40, 40, 40]);
    this.phase = 'broke';
    this.brokeT = 0;
  }

  private onCaught(): void {
    vibrate([60, 60, 120]);
    addToCollection({
      shadowId: this.shadow.id,
      spawnId: this.spawn.id,
      lat: this.spawn.lat,
      lng: this.spawn.lng,
      throws: this.throws,
    });
    this.showResult(`Caught ${this.shadow.name}!`, this.shadow.lore, 'caught');
  }

  private onFled(): void {
    markSpawnResolved(this.spawn.id, this.spawn.expiresAt);
    this.showResult(`${this.shadow.name} fled`, 'It slipped back into the dark.', 'fled');
  }

  private showResult(title: string, body: string, result: EncounterResult): void {
    this.phase = 'done';
    cancelAnimationFrame(this.raf);
    this.draw();
    const panel = document.createElement('div');
    panel.className = `sz-enc-result sz-enc-${result}`;
    panel.innerHTML = `
      ${result === 'caught' ? `<img src="${artUrl(this.shadow.art)}" alt="" onerror="this.remove()">` : ''}
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
      <button class="sz-btn">Continue</button>`;
    panel.querySelector('button')!.onclick = () => this.finish(result);
    this.root.appendChild(panel);
  }

  private finish(result: EncounterResult): void {
    this.phase = 'done';
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.root.remove();
    this.onDone(result);
  }

  private toastTimer = 0;
  private showToast(text: string): void {
    this.toast.textContent = text;
    this.toast.classList.add('sz-show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('sz-show'), 1100);
  }

  // ---- rendering ----------------------------------------------------------

  private draw(): void {
    const { ctx, w, h } = this;
    const bg = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.5, Math.max(w, h));
    bg.addColorStop(0, '#1b1530');
    bg.addColorStop(1, '#05040a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Drifting fog.
    for (let i = 0; i < 5; i++) {
      const fx = ((this.t * (10 + i * 6) + i * 200) % (w + 400)) - 200;
      const fy = h * (0.25 + i * 0.12);
      const fog = ctx.createRadialGradient(fx, fy, 0, fx, fy, 220);
      fog.addColorStop(0, 'rgba(120,110,160,0.07)');
      fog.addColorStop(1, 'rgba(120,110,160,0)');
      ctx.fillStyle = fog;
      ctx.fillRect(fx - 220, fy - 220, 440, 440);
    }

    // Ground.
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.36 + this.shadowSize * 0.5, w * 0.45, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    const sp = this.shadowPos();
    const size = this.shadowSize;
    const hidden = this.phase === 'capturing';
    if (!hidden) {
      const flicker = this.phase === 'broke' ? 0.5 + 0.5 * Math.sin(this.t * 60) : 1;
      ctx.save();
      ctx.globalAlpha = flicker;
      ctx.shadowColor = this.shadow.glow;
      ctx.shadowBlur = 30;
      if (this.imgOk) ctx.drawImage(this.img, sp.x - size / 2, sp.y - size / 2, size, size);
      else drawSilhouette(ctx, sp.x, sp.y, size, this.shadow.glow, this.t);
      ctx.restore();

      // Target rings.
      if (this.phase === 'idle' || this.phase === 'aiming' || this.phase === 'flying') {
        const base = size * 0.32;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, base, 0, Math.PI * 2);
        ctx.stroke();
        const rs = this.phase === 'flying' ? this.lockedRing : this.ringScale();
        ctx.strokeStyle = rs < 0.4 ? '#ffd23b' : rs < 0.7 ? '#36e0c8' : this.shadow.glow;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, base * rs, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Orb.
    let ox = this.orb.x;
    let oy = this.orb.y;
    let or = this.orb.r;
    if (this.phase === 'capturing') {
      ox = this.captureAt.x + Math.sin(this.captureT * 18) * 8 * (this.captureT % 0.8 < 0.35 ? 1 : 0);
      oy = this.captureAt.y;
      or = 18;
    }
    if (this.phase !== 'broke' && this.phase !== 'done') drawOrb(ctx, ox, oy, or, this.t);
    if (this.phase === 'idle') {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Swipe the orb up to throw', w / 2, h - 30);
    }
  }
}

/** Base catch rate boosted by throw quality, capped so nothing is guaranteed. */
export function catchChance(base: number, multiplier: number): number {
  return Math.min(0.95, Math.max(0.01, base * multiplier));
}

function pathBow(trail: { x: number; y: number }[]): number {
  if (trail.length < 3) return 0;
  const a = trail[0];
  const b = trail[trail.length - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let max = 0;
  for (const p of trail) {
    // Signed perpendicular distance from the chord.
    const d = ((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len;
    if (Math.abs(d) > Math.abs(max)) max = d;
  }
  return max;
}

function drawOrb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
  glow.addColorStop(0, 'rgba(255,250,220,0.55)');
  glow.addColorStop(1, 'rgba(255,250,220,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
  ctx.fill();
  const core = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.5, '#fff3b0');
  core.addColorStop(1, '#f0b429');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r * (1 + Math.sin(t * 6) * 0.03), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Fallback art when the species image is missing: a hooded figure with eyes. */
export function drawSilhouette(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, glow: string, t: number): void {
  const s = size / 100;
  ctx.save();
  ctx.translate(cx - 50 * s, cy - 50 * s);
  ctx.scale(s, s);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(50, 6);
  ctx.bezierCurveTo(68, 6, 72, 24, 70, 36);
  ctx.bezierCurveTo(86, 44, 90, 70, 92, 100);
  ctx.lineTo(8, 100);
  ctx.bezierCurveTo(10, 70, 14, 44, 30, 36);
  ctx.bezierCurveTo(28, 24, 32, 6, 50, 6);
  ctx.fill();
  const blink = Math.sin(t * 0.9) > 0.97 ? 0.2 : 1;
  ctx.fillStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.ellipse(42, 26, 3.2, 2 * blink, 0, 0, Math.PI * 2);
  ctx.ellipse(58, 26, 3.2, 2 * blink, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function vibrate(p: number | number[]): void {
  try { navigator.vibrate?.(p); } catch { /* unsupported */ }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
