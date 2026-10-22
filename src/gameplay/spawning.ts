import { SHADOWS, timeOfDay } from '../content/shadows';
import type { ShadowType } from '../content/types';
import { hashString, mulberry32, pickWeighted } from './rng';

/** Size of one spawn cell in degrees (~150 m of latitude). */
export const CELL_DEG = 0.00135;
/** Spawns in a cell reroll every window. */
export const WINDOW_MS = 10 * 60 * 1000;
/** How far from the player spawns are generated and shown. */
export const VISIBLE_RADIUS_M = 250;
/** How close the player must be to start an encounter. */
export const INTERACT_RADIUS_M = 80;

const MAX_PER_CELL = 3;
const SEED_SALT = 'shadozman-v1';

export interface Spawn {
  /** Stable id: same cell + window + slot always produces the same id. */
  id: string;
  shadow: ShadowType;
  lat: number;
  lng: number;
  /** Epoch ms when this spawn despawns. */
  expiresAt: number;
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Shadows that may appear at this moment, based on their spawn.times. */
export function eligibleShadows(now: Date): ShadowType[] {
  const tod = timeOfDay(now);
  return SHADOWS.filter((s) => s.spawn.times.includes(tod));
}

/** Deterministic spawns for one grid cell in one time window. */
export function spawnsForCell(cx: number, cy: number, window: number, now: Date): Spawn[] {
  const pool = eligibleShadows(now);
  if (pool.length === 0) return [];
  const rand = mulberry32(hashString(`${SEED_SALT}:${cx}:${cy}:${window}`));
  // Skewed toward 0-1 spawns per cell so the map isn't crowded.
  const r = rand();
  const count = r < 0.35 ? 0 : r < 0.75 ? 1 : r < 0.93 ? 2 : MAX_PER_CELL;
  const spawns: Spawn[] = [];
  for (let i = 0; i < count; i++) {
    const shadow = pickWeighted(pool, (s) => s.spawn.weight, rand);
    if (!shadow) continue;
    spawns.push({
      id: `${cx}:${cy}:${window}:${i}`,
      shadow,
      lat: (cy + rand()) * CELL_DEG,
      lng: (cx + rand()) * CELL_DEG,
      expiresAt: (window + 1) * WINDOW_MS,
    });
  }
  return spawns;
}

/** All spawns within VISIBLE_RADIUS_M of the player right now. */
export function spawnsNear(lat: number, lng: number, now: Date = new Date()): Spawn[] {
  const window = Math.floor(now.getTime() / WINDOW_MS);
  const cy0 = Math.floor(lat / CELL_DEG);
  const cx0 = Math.floor(lng / CELL_DEG);
  // Longitude cells shrink toward the poles; widen the search to compensate.
  const latSpan = Math.ceil(VISIBLE_RADIUS_M / (CELL_DEG * 111320)) + 1;
  const lngSpan = Math.ceil(latSpan / Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const out: Spawn[] = [];
  for (let dy = -latSpan; dy <= latSpan; dy++) {
    for (let dx = -lngSpan; dx <= lngSpan; dx++) {
      for (const s of spawnsForCell(cx0 + dx, cy0 + dy, window, now)) {
        if (distanceMeters(lat, lng, s.lat, s.lng) <= VISIBLE_RADIUS_M) out.push(s);
      }
    }
  }
  return out;
}
