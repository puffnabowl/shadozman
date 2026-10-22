import type { Rarity, ShadowType, TimeOfDay } from './types';

export type { Habitat, Rarity, ShadowSpawn, ShadowStats, ShadowType, TimeOfDay } from './types';

const art = (id: string) => `${import.meta.env.BASE_URL}shadows/${id}.svg`;

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/** Share of spawns per rarity tier before per-species weights apply. Sums to 100. */
export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 58,
  uncommon: 26,
  rare: 11,
  epic: 4,
  legendary: 1,
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

/** Matches the --sz-rarity-* variables in theme.css. */
export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8f8aa3',
  uncommon: '#5fd3a6',
  rare: '#5aa8ff',
  epic: '#c27bff',
  legendary: '#ffb547',
};

export function timeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h < 4) return 'witching';
  if (h < 7) return 'dawn';
  if (h < 18) return 'day';
  if (h < 21) return 'dusk';
  return 'night';
}

/** True if a species can appear in the given bucket. Witching hour also admits night spawns. */
export function canSpawnAt(shadow: ShadowType, time: TimeOfDay): boolean {
  return (
    shadow.spawn.times.includes(time) ||
    (time === 'witching' && shadow.spawn.times.includes('night'))
  );
}

export const SHADOWS: ShadowType[] = [
  // ── Common ────────────────────────────────────────────────
  {
    id: 'lurkling',
    dexNumber: 1,
    name: 'Lurkling',
    title: 'The Corner Peeker',
    rarity: 'common',
    lore: 'Lurklings live in the inch between a wall and the edge of your vision. They are harmless, endlessly curious, and vanish the moment you turn your head, which is why most people have seen one and nobody has looked at one.',
    stats: { menace: 8, stealth: 34, speed: 40, resolve: 10 },
    catchRate: 0.6,
    fleeRate: 0.08,
    spawn: { times: ['dusk', 'night'], habitats: ['urban', 'residential'], weight: 10 },
    art: art('lurkling'),
    glow: '#b8a6ff',
  },
  {
    id: 'hallwalker',
    dexNumber: 2,
    name: 'Hallwalker',
    title: 'The Doorway Figure',
    rarity: 'common',
    lore: 'A Hallwalker crosses the end of a hallway at night, unhurried, and is gone before you sit up. It does not go anywhere in particular. Researchers think it is simply keeping the house company.',
    stats: { menace: 18, stealth: 22, speed: 30, resolve: 14 },
    catchRate: 0.55,
    fleeRate: 0.1,
    spawn: { times: ['night'], habitats: ['residential'], weight: 9 },
    art: art('hallwalker'),
    glow: '#9fb4ff',
  },
  {
    id: 'flicker',
    dexNumber: 3,
    name: 'Flicker',
    title: 'The Streetlight Stutter',
    rarity: 'common',
    lore: 'When a streetlight blinks for no reason, a Flicker has stepped through its beam. They feed on the half-second of dark between flashes and get jittery around steady light.',
    stats: { menace: 12, stealth: 20, speed: 62, resolve: 8 },
    catchRate: 0.5,
    fleeRate: 0.14,
    spawn: { times: ['dusk', 'night'], habitats: ['urban'], weight: 10 },
    art: art('flicker'),
    glow: '#ffe28a',
  },
  {
    id: 'smudge',
    dexNumber: 4,
    name: 'Smudge',
    title: 'The Photobomb',
    rarity: 'common',
    lore: 'The blur in the background of your group photo that nobody remembers standing there. Smudges are the only shadow people that come out in daylight, and only when a camera is pointed somewhere else.',
    stats: { menace: 5, stealth: 40, speed: 25, resolve: 6 },
    catchRate: 0.65,
    fleeRate: 0.06,
    spawn: { times: ['day', 'dusk'], habitats: ['any'], weight: 8 },
    art: art('smudge'),
    glow: '#d8d2e8',
  },
  {
    id: 'stairbottom',
    dexNumber: 5,
    name: 'Stairbottom',
    title: 'The One Who Waits Below',
    rarity: 'common',
    lore: 'Every child knows to run up the basement stairs. Stairbottoms are why. They crouch on the last step with their knees to their chin, and they have never once tried to follow.',
    stats: { menace: 24, stealth: 30, speed: 15, resolve: 18 },
    catchRate: 0.5,
    fleeRate: 0.08,
    spawn: { times: ['night'], habitats: ['residential'], weight: 7 },
    art: art('stairbottom'),
    glow: '#ff8a7a',
  },
  {
    id: 'puddlegaunt',
    dexNumber: 6,
    name: 'Puddlegaunt',
    title: 'The Wrong Reflection',
    rarity: 'common',
    lore: 'Look down into a rain puddle and your reflection looks back up. Usually. Puddlegaunts borrow reflections when no one is checking and give them back slightly too thin.',
    stats: { menace: 14, stealth: 36, speed: 34, resolve: 12 },
    catchRate: 0.55,
    fleeRate: 0.1,
    spawn: { times: ['dawn', 'dusk', 'night'], habitats: ['water', 'urban'], weight: 8 },
    art: art('puddlegaunt'),
    glow: '#6fe0ff',
  },

  // ── Uncommon ──────────────────────────────────────────────
  {
    id: 'brimwarden',
    dexNumber: 7,
    name: 'Brimwarden',
    title: 'The Wide-Brimmed Stranger',
    rarity: 'uncommon',
    lore: 'Tall, still, coat to the ankles, hat brim wide enough to hide its face. Brimwardens stand under bridges and at bus stops after midnight as if waiting for a ride that stopped running years ago.',
    stats: { menace: 46, stealth: 38, speed: 22, resolve: 40 },
    catchRate: 0.38,
    fleeRate: 0.16,
    spawn: { times: ['night', 'witching'], habitats: ['urban'], weight: 6 },
    art: art('brimwarden'),
    glow: '#ff5d73',
  },
  {
    id: 'sleepsitter',
    dexNumber: 8,
    name: 'Sleepsitter',
    title: 'The Weight on Your Chest',
    rarity: 'uncommon',
    lore: 'You wake, but cannot move, and something is perched at the foot of the bed. Sleepsitters are heavy for their size and very patient. They leave the moment you manage to wiggle a toe.',
    stats: { menace: 58, stealth: 26, speed: 12, resolve: 44 },
    catchRate: 0.34,
    fleeRate: 0.12,
    spawn: { times: ['witching'], habitats: ['residential'], weight: 5 },
    art: art('sleepsitter'),
    glow: '#a07bff',
  },
  {
    id: 'pinewatch',
    dexNumber: 9,
    name: 'Pinewatch',
    title: 'The Treeline Sentinel',
    rarity: 'uncommon',
    lore: 'At the edge of every park there is one tree trunk that is slightly too narrow and slightly too dark. Pinewatches count joggers. Nobody knows what happens when the number gets high enough.',
    stats: { menace: 30, stealth: 60, speed: 18, resolve: 30 },
    catchRate: 0.4,
    fleeRate: 0.18,
    spawn: { times: ['dusk', 'night'], habitats: ['park'], weight: 6 },
    art: art('pinewatch'),
    glow: '#9dff8a',
  },
  {
    id: 'rustwraith',
    dexNumber: 10,
    name: 'Rustwraith',
    title: 'The Night Shift',
    rarity: 'uncommon',
    lore: 'Rustwraiths clock in when the factories clock out. They walk the catwalks of empty warehouses, tapping pipes in a rhythm the old night guards swear is Morse for "still here".',
    stats: { menace: 40, stealth: 28, speed: 36, resolve: 50 },
    catchRate: 0.36,
    fleeRate: 0.14,
    spawn: { times: ['night', 'witching'], habitats: ['industrial'], weight: 5 },
    art: art('rustwraith'),
    glow: '#ff9a3d',
  },
  {
    id: 'benchling',
    dexNumber: 11,
    name: 'Benchling',
    title: 'The Memorial Sitter',
    rarity: 'uncommon',
    lore: 'Benchlings sit on park benches that carry a little brass plaque. They feed the pigeons nothing, watch the pond, and move over politely if you sit down. Most visitors never notice they shared the seat.',
    stats: { menace: 6, stealth: 48, speed: 10, resolve: 20 },
    catchRate: 0.45,
    fleeRate: 0.05,
    spawn: { times: ['day', 'dusk'], habitats: ['park'], weight: 5 },
    art: art('benchling'),
    glow: '#ffd8a8',
  },

  // ── Rare ──────────────────────────────────────────────────
  {
    id: 'lamplanky',
    dexNumber: 12,
    name: 'Lamplanky',
    title: 'The Too-Tall',
    rarity: 'rare',
    lore: 'Lamplankies are exactly as tall as the nearest lamp post, which is the first thing wrong with them. Their arms reach their knees. They lean in when you pass, as if trying to read your phone.',
    stats: { menace: 62, stealth: 30, speed: 44, resolve: 52 },
    catchRate: 0.26,
    fleeRate: 0.2,
    spawn: { times: ['night', 'witching'], habitats: ['urban', 'residential'], weight: 4 },
    art: art('lamplanky'),
    glow: '#fff3b0',
  },
  {
    id: 'graveshade',
    dexNumber: 13,
    name: 'Graveshade',
    title: 'The Unvisited',
    rarity: 'rare',
    lore: 'Graveshades rise from headstones whose names have worn away. They are not angry, only forgotten, and a Graveshade that is read its name aloud is said to sink back down content.',
    stats: { menace: 54, stealth: 42, speed: 20, resolve: 60 },
    catchRate: 0.24,
    fleeRate: 0.16,
    spawn: { times: ['night', 'witching'], habitats: ['cemetery'], weight: 4 },
    art: art('graveshade'),
    glow: '#7dffd4',
  },
  {
    id: 'ferrymute',
    dexNumber: 14,
    name: 'Ferrymute',
    title: 'The Fog Boatman',
    rarity: 'rare',
    lore: 'On foggy mornings and evenings a low boat drifts along the far bank with a hooded figure poling it. It never reaches the shore and never makes a sound. Ducks will not swim near it.',
    stats: { menace: 48, stealth: 56, speed: 28, resolve: 46 },
    catchRate: 0.25,
    fleeRate: 0.22,
    spawn: { times: ['dawn', 'dusk'], habitats: ['water'], weight: 3 },
    art: art('ferrymute'),
    glow: '#8fd0ff',
  },
  {
    id: 'hollowchild',
    dexNumber: 15,
    name: 'Hollowchild',
    title: 'The Lost Playmate',
    rarity: 'rare',
    lore: 'Hollowchildren appear at the edges of empty playgrounds, holding a string that leads to nothing. Through the hole in their chest you can see a faint, warm light, like a porch lamp left on for someone.',
    stats: { menace: 36, stealth: 50, speed: 46, resolve: 38 },
    catchRate: 0.28,
    fleeRate: 0.24,
    spawn: { times: ['dusk'], habitats: ['park', 'residential'], weight: 3 },
    art: art('hollowchild'),
    glow: '#ffcf6b',
  },

  // ── Epic ──────────────────────────────────────────────────
  {
    id: 'hooded-choir',
    dexNumber: 16,
    name: 'Hooded Choir',
    title: 'The Three Who Hum',
    rarity: 'epic',
    lore: 'Always three, always in hoods, always humming a note just below hearing that makes dogs whine. The Choir only gathers where three paths meet in a cemetery, and stops the instant anyone hums back.',
    stats: { menace: 74, stealth: 44, speed: 24, resolve: 72 },
    catchRate: 0.16,
    fleeRate: 0.2,
    spawn: { times: ['witching'], habitats: ['cemetery'], weight: 2 },
    art: art('hooded-choir'),
    glow: '#ff6bd6',
  },
  {
    id: 'mirrorkin',
    dexNumber: 17,
    name: 'Mirrorkin',
    title: 'The Late Reflection',
    rarity: 'epic',
    lore: 'A Mirrorkin lives in shop windows and dark phone screens and copies whoever passes, a fraction of a second late. Catching one is tricky: it always dodges the same way you throw.',
    stats: { menace: 66, stealth: 70, speed: 68, resolve: 58 },
    catchRate: 0.14,
    fleeRate: 0.24,
    spawn: { times: ['dusk', 'night'], habitats: ['urban'], weight: 2 },
    art: art('mirrorkin'),
    glow: '#c9c4ff',
  },
  {
    id: 'static-mother',
    dexNumber: 18,
    name: 'Static Mother',
    title: 'The Hum in the Wires',
    rarity: 'epic',
    lore: 'Her hair is the crackle on an old radio and her voice is the buzz of a transformer at 3 a.m. Static Mother tends the power lines and is fiercely protective of the small shadows that shelter under them.',
    stats: { menace: 80, stealth: 32, speed: 54, resolve: 78 },
    catchRate: 0.12,
    fleeRate: 0.18,
    spawn: { times: ['witching'], habitats: ['industrial', 'urban'], weight: 2 },
    art: art('static-mother'),
    glow: '#7af0ff',
  },

  // ── Legendary ─────────────────────────────────────────────
  {
    id: 'the-unlit',
    dexNumber: 19,
    name: 'The Unlit',
    title: 'The Dark Between Stars',
    rarity: 'legendary',
    lore: 'Every shadow ever cast is said to remember where it came from, and it came from here. The Unlit is less a person than a place with eyes. When it spawns, every other shadow on the map goes quiet.',
    stats: { menace: 100, stealth: 88, speed: 40, resolve: 96 },
    catchRate: 0.05,
    fleeRate: 0.3,
    spawn: { times: ['witching'], habitats: ['any'], weight: 1 },
    art: art('the-unlit'),
    glow: '#e04bff',
  },
  {
    id: 'duskcrown',
    dexNumber: 20,
    name: 'Duskcrown',
    title: 'Sovereign of the Long Shadow',
    rarity: 'legendary',
    lore: 'For the few minutes when the sun sits on the horizon and every shadow stretches to its full length, they all point toward the Duskcrown. It rules for those minutes only, and spends them counting its subjects.',
    stats: { menace: 92, stealth: 60, speed: 70, resolve: 100 },
    catchRate: 0.06,
    fleeRate: 0.28,
    spawn: { times: ['dusk'], habitats: ['any'], weight: 1 },
    art: art('duskcrown'),
    glow: '#ff7a3d',
  },
];

const BY_ID = new Map(SHADOWS.map((s) => [s.id, s]));

export function getShadow(id: string): ShadowType | undefined {
  return BY_ID.get(id);
}
