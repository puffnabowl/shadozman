// The seams between the core app and the other modules.
//
//   src/gameplay/  (spawning & catching)  must export the GameplayModule shape.
//   src/content/   (shadow art & lore)    must export the ContentModule shape,
//                                          plus an optional theme.css.
//
// Core loads both optionally (see plugins.ts), so the app still builds and
// runs while either module is missing.

import type L from 'leaflet';

export interface GameplayHandle {
  /** Called on every player position update. */
  updatePlayer(lat: number, lng: number): void;
}

export interface GameplayModule {
  initGameplay(map: L.Map): GameplayHandle;
  /** Renders the player's collection into the given container (replacing its contents). */
  renderCollection(container: HTMLElement): void;
  getCollection(): unknown;
}

export interface ContentModule {
  SHADOWS: Array<{ id: string; name: string; dexNumber: number; rarity: string; art: string }>;
  getShadow(id: string): unknown;
}

// Camera: gameplay may load src/core/camera.ts and call
//   startCamera(): Promise<CameraHandle | null>
// null means no camera (denied, insecure, missing); core has already told the player.
export type { CameraHandle } from './camera';
