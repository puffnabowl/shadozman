// Spawning & catching module. Core loads this file and uses initGameplay,
// renderCollection and getCollection (see src/core/contracts.ts).
import './gameplay.css';

export { initGameplay, type GameplayHandle } from './mapLayer';
export { getCollection, getDex, renderCollection, type CaughtShadow } from './collection';
export { openEncounter, type EncounterResult } from './encounter';
export { spawnsNear, type Spawn } from './spawning';
