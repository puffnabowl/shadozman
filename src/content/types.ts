export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Local-time buckets. `witching` is 00:00–03:59 and also counts as night for spawning. */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night' | 'witching';

export type Habitat =
  | 'urban'
  | 'park'
  | 'water'
  | 'residential'
  | 'industrial'
  | 'cemetery'
  | 'any';

export interface ShadowStats {
  /** How frightening it is; drives encounter music and shake. 1–100 */
  menace: number;
  /** How hard it is to spot on the map; higher = smaller reveal radius. 1–100 */
  stealth: number;
  /** How fast it dodges and drifts in the catch screen. 1–100 */
  speed: number;
  /** How hard it fights a capture once lit. 1–100 */
  resolve: number;
}

export interface ShadowSpawn {
  times: TimeOfDay[];
  habitats: Habitat[];
  /** Relative weight within the eligible pool. */
  weight: number;
}

export interface ShadowType {
  id: string;
  dexNumber: number;
  name: string;
  /** Short epithet shown under the name, e.g. "The Corner Peeker". */
  title: string;
  rarity: Rarity;
  lore: string;
  stats: ShadowStats;
  /** Base chance a single throw captures it, 0–1. */
  catchRate: number;
  /** Chance it vanishes after a failed throw, 0–1. */
  fleeRate: number;
  spawn: ShadowSpawn;
  /** Public URL of the transparent, square SVG portrait. */
  art: string;
  /** Accent color for eyes, glow and UI highlights. */
  glow: string;
}
