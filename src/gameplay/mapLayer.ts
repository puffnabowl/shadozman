import L from 'leaflet';
import { isSpawnResolved } from './collection';
import { huntSpawn } from './search';
import { distanceMeters, INTERACT_RADIUS_M, spawnsNear, type Spawn } from './spawning';

export interface GameplayHandle {
  updatePlayer(lat: number, lng: number): void;
}

/** Re-scan for spawns at least this often even if the player stands still. */
const RESCAN_MS = 15_000;

export function initGameplay(map: L.Map): GameplayHandle {
  const layer = L.layerGroup().addTo(map);
  const markers = new Map<string, L.Marker>();
  let player: { lat: number; lng: number } | null = null;
  let inEncounter = false;

  const toast = document.createElement('div');
  toast.className = 'sz-map-toast';
  document.body.appendChild(toast);
  let toastTimer = 0;
  const showToast = (text: string) => {
    toast.textContent = text;
    toast.classList.add('sz-show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('sz-show'), 1800);
  };

  // The map only shows that *something* is lurking; which shadow it is stays
  // hidden until the player finds it with the camera.
  const iconFor = (near: boolean): L.DivIcon =>
    L.divIcon({
      className: `sz-marker${near ? ' sz-near' : ''}`,
      html: `<div class="sz-marker-inner sz-lurk"><div class="sz-marker-fallback"></div></div>`,
      iconSize: [56, 56],
      iconAnchor: [28, 50],
    });

  const onTap = async (spawn: Spawn) => {
    if (inEncounter || !player) return;
    if (Date.now() > spawn.expiresAt) {
      showToast('It faded away…');
      refresh();
      return;
    }
    const d = distanceMeters(player.lat, player.lng, spawn.lat, spawn.lng);
    if (d > INTERACT_RADIUS_M) {
      showToast(`Something is hiding ${spawn.hidingSpot.where}, ${Math.round(d)} m away. Get within ${INTERACT_RADIUS_M} m.`);
      return;
    }
    inEncounter = true;
    try {
      await huntSpawn(spawn);
    } finally {
      inEncounter = false;
      refresh();
    }
  };

  function refresh(): void {
    if (!player) return;
    const now = new Date();
    const spawns = spawnsNear(player.lat, player.lng, now).filter(
      (s) => !isSpawnResolved(s.id) && s.expiresAt > now.getTime(),
    );
    const keep = new Set(spawns.map((s) => s.id));
    for (const [id, m] of markers) {
      if (!keep.has(id)) {
        layer.removeLayer(m);
        markers.delete(id);
      }
    }
    for (const s of spawns) {
      const near = distanceMeters(player.lat, player.lng, s.lat, s.lng) <= INTERACT_RADIUS_M;
      let m = markers.get(s.id);
      if (!m) {
        m = L.marker([s.lat, s.lng], { icon: iconFor(near), title: `Something hiding ${s.hidingSpot.where}`, riseOnHover: true });
        (m as L.Marker & { _near?: boolean })._near = near;
        m.on('click', () => onTap(s));
        layer.addLayer(m);
        markers.set(s.id, m);
      } else if ((m as L.Marker & { _near?: boolean })._near !== near) {
        m.setIcon(iconFor(near));
        (m as L.Marker & { _near?: boolean })._near = near;
      }
    }
  }

  window.setInterval(refresh, RESCAN_MS);

  return {
    updatePlayer(lat: number, lng: number) {
      player = { lat, lng };
      refresh();
    },
  };
}
