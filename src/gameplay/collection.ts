import { getShadow, SHADOWS } from '../content/shadows';
import { artUrl } from './art';

const COLLECTION_KEY = 'shadozman.collection.v1';
const RESOLVED_KEY = 'shadozman.resolvedSpawns.v1';

export interface CaughtShadow {
  /** Unique per catch. */
  uid: string;
  shadowId: string;
  spawnId: string;
  caughtAt: number;
  lat: number;
  lng: number;
  /** Number of orbs thrown in the encounter. */
  throws: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game still works, it just won't remember.
  }
}

export function getCollection(): CaughtShadow[] {
  return read<CaughtShadow[]>(COLLECTION_KEY, []);
}

export function addToCollection(entry: Omit<CaughtShadow, 'uid' | 'caughtAt'>): CaughtShadow {
  const caught: CaughtShadow = {
    ...entry,
    uid: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    caughtAt: Date.now(),
  };
  const list = getCollection();
  list.push(caught);
  write(COLLECTION_KEY, list);
  markSpawnResolved(entry.spawnId, Date.now() + 60 * 60 * 1000);
  window.dispatchEvent(new CustomEvent('shadozman:caught', { detail: caught }));
  return caught;
}

/** Caught or fled spawns are hidden until they would have expired anyway. */
export function markSpawnResolved(spawnId: string, until: number): void {
  const now = Date.now();
  const map = read<Record<string, number>>(RESOLVED_KEY, {});
  for (const k of Object.keys(map)) if (map[k] < now) delete map[k];
  map[spawnId] = until;
  write(RESOLVED_KEY, map);
}

export function isSpawnResolved(spawnId: string): boolean {
  const until = read<Record<string, number>>(RESOLVED_KEY, {})[spawnId];
  return until !== undefined && until > Date.now();
}

export interface DexEntry {
  shadowId: string;
  count: number;
  firstCaughtAt: number;
}

/** One row per species caught, in dex order. */
export function getDex(): DexEntry[] {
  const byId = new Map<string, DexEntry>();
  for (const c of getCollection()) {
    const e = byId.get(c.shadowId);
    if (e) e.count++;
    else byId.set(c.shadowId, { shadowId: c.shadowId, count: 1, firstCaughtAt: c.caughtAt });
  }
  return [...byId.values()].sort(
    (a, b) => (getShadow(a.shadowId)?.dexNumber ?? 0) - (getShadow(b.shadowId)?.dexNumber ?? 0),
  );
}

/** Renders a simple dex grid: caught species in color, uncaught as a named silhouette. */
export function renderCollection(container: HTMLElement): void {
  const dex = new Map(getDex().map((d) => [d.shadowId, d]));
  const total = getCollection().length;
  container.innerHTML = '';
  container.classList.add('sz-collection');
  const header = document.createElement('div');
  header.className = 'sz-collection-header';
  header.textContent = `${dex.size} / ${SHADOWS.length} species · ${total} caught`;
  container.appendChild(header);
  const grid = document.createElement('div');
  grid.className = 'sz-collection-grid';
  for (const s of [...SHADOWS].sort((a, b) => a.dexNumber - b.dexNumber)) {
    const entry = dex.get(s.id);
    const card = document.createElement('div');
    card.className = `sz-card ${entry ? 'sz-caught' : 'sz-unknown'} sz-rarity-${s.rarity}`;
    card.style.setProperty('--glow', s.glow);
    const num = `#${String(s.dexNumber).padStart(3, '0')}`;
    card.innerHTML = entry
      ? `<img src="${artUrl(s.art)}" alt="" onerror="this.style.visibility='hidden'"><div class="sz-card-name">${num} ${escapeHtml(s.name)}</div>
         <div class="sz-card-meta">${s.rarity} · ×${entry.count}</div>
         <div class="sz-card-lore">${escapeHtml(s.lore)}</div>`
      : `<div class="sz-card-silhouette"></div><div class="sz-card-name">${num} ${escapeHtml(s.name)}</div>
         <div class="sz-card-meta">${s.rarity} · not caught yet</div>`;
    grid.appendChild(card);
  }
  container.appendChild(grid);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
