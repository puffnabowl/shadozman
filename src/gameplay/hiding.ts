import type { Habitat } from '../content/types';
import { hashString, mulberry32, pickWeighted } from './rng';

export interface HidingSpot {
  id: string;
  /** Reads after "hiding …", e.g. "in a heating vent". */
  where: string;
  /** What to point the camera at. */
  tip: string;
  habitats: Habitat[];
}

export const HIDING_SPOTS: HidingSpot[] = [
  { id: 'under-bed', where: 'under a bed', tip: 'Get low and look into the gap under the bed.', habitats: ['residential'] },
  { id: 'cabinet', where: 'in a cabinet', tip: 'Open a cabinet and point into the back corner.', habitats: ['residential', 'urban'] },
  { id: 'closet', where: 'in the back of a closet', tip: 'Crack the closet door and look behind the clothes.', habitats: ['residential'] },
  { id: 'vent', where: 'in a vent', tip: 'Point at the slats of a vent or air return.', habitats: ['residential', 'industrial', 'urban'] },
  { id: 'behind-fridge', where: 'behind the fridge', tip: 'Look into the gap beside or behind the fridge.', habitats: ['residential'] },
  { id: 'crawlspace', where: 'in a crawlspace', tip: 'Find a crawlspace door, basement corner or the space under the stairs.', habitats: ['residential'] },
  { id: 'sewer', where: 'in a sewer grate', tip: 'Point down through a storm drain or manhole grate.', habitats: ['urban', 'water', 'industrial'] },
  { id: 'drain', where: 'down a drain', tip: 'Look into a sink, shower or gutter drain.', habitats: ['water', 'residential'] },
  { id: 'culvert', where: 'in a culvert', tip: 'Look into a pipe or tunnel under a path or road.', habitats: ['water', 'park'] },
  { id: 'dumpster', where: 'behind a dumpster', tip: 'Point into the shadow behind or under a dumpster.', habitats: ['urban', 'industrial'] },
  { id: 'alley', where: 'in a dark doorway', tip: 'Find a recessed doorway or the gap between two buildings.', habitats: ['urban', 'industrial'] },
  { id: 'hollow', where: 'in a hollow', tip: 'Look into a tree hollow, a hedge or under a bush.', habitats: ['park'] },
  { id: 'crypt', where: 'in a crack in the stone', tip: 'Look into the gaps around old stone, steps or walls.', habitats: ['cemetery'] },
];

/** Deterministic hiding spot for a spawn, biased toward the shadow's habitats. */
export function hidingSpotFor(spawnId: string, habitats: Habitat[]): HidingSpot {
  const rand = mulberry32(hashString(`hide:${spawnId}`));
  const any = habitats.length === 0 || habitats.includes('any');
  return (
    pickWeighted(HIDING_SPOTS, (s) => (any || s.habitats.some((h) => habitats.includes(h)) ? 3 : 1), rand) ??
    HIDING_SPOTS[0]
  );
}
