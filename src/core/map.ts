import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PlayerLocator, PlayerPosition } from './geo';

const PLAY_ZOOM = 18;

export interface GameMap {
  map: L.Map;
  /** True while the camera is locked onto the player. */
  isFollowing(): boolean;
  recenter(): void;
}

export function createGameMap(el: HTMLElement, locator: PlayerLocator, recenterBtn: HTMLButtonElement): GameMap {
  const map = L.map(el, {
    zoomControl: false,
    attributionControl: true,
    minZoom: 15,
    maxZoom: 19,
    zoomSnap: 0.5,
  }).setView([0, 0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }).addTo(map);

  const playerIcon = L.divIcon({
    className: 'player-marker',
    html: '<div class="player-pulse"></div><div class="player-dot"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  let player: L.Marker | null = null;
  let accuracyRing: L.Circle | null = null;
  let following = true;

  const setFollowing = (on: boolean) => {
    following = on;
    recenterBtn.hidden = on;
  };

  // Any manual pan breaks follow mode; the recenter button restores it.
  map.on('dragstart', () => setFollowing(false));

  const onPosition = (pos: PlayerPosition) => {
    const ll = L.latLng(pos.lat, pos.lng);
    if (!player) {
      player = L.marker(ll, { icon: playerIcon, interactive: false, zIndexOffset: 1000 }).addTo(map);
      accuracyRing = L.circle(ll, { radius: pos.accuracy, className: 'accuracy-ring', interactive: false }).addTo(map);
      map.setView(ll, PLAY_ZOOM, { animate: false });
    } else {
      player.setLatLng(ll);
      accuracyRing!.setLatLng(ll).setRadius(pos.accuracy);
      if (following) map.panTo(ll, { animate: true, duration: 0.5 });
    }
  };
  locator.onPosition(onPosition);

  // In demo mode, a long press / right click on the map teleports the player.
  map.on('contextmenu', (e: L.LeafletMouseEvent) => locator.teleport(e.latlng.lat, e.latlng.lng));

  const recenter = () => {
    setFollowing(true);
    const p = locator.position;
    if (p) map.setView([p.lat, p.lng], Math.max(map.getZoom(), PLAY_ZOOM - 1));
  };
  recenterBtn.addEventListener('click', recenter);

  return { map, isFollowing: () => following, recenter };
}
