import L from 'leaflet';
import { isSpawnResolved } from './collection';
import { huntSpawn } from './search';
import { tellFor, tellHtml } from './tells';
import { distanceMeters, INTERACT_RADIUS_M, spawnsNear, type Spawn } from './spawning';

export interface GameplayHandle {
  updatePlayer(lat: number, lng: number): void;
}

/** Re-scan for spawns at least this often even if the player stands still. */
const RESCAN_MS = 15_000;

const TELL_LABEL = { eyes: 'Eyes watching', hands: 'Hands reaching out', smile: 'A smile grinning' } as const;
const tellLabel = (s: Spawn) => TELL_LABEL[tellFor(s.shadow)];

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

  // The map shows a tell (eyes, hands or a smile) in the dark, labelled with
  // the shadow's name; the full shadow appears once found with the camera.
  const iconFor = (spawn: Spawn, near: boolean): L.DivIcon =>
    L.divIcon({
      className: `sz-marker sz-tell-marker${near ? ' sz-near' : ''}`,
      html: `<div class="sz-marker-inner sz-lurk" style="--glow:${spawn.shadow.glow}">${tellHtml(spawn.shadow)}</div><div class="sz-marker-name" style="--glow:${spawn.shadow.glow}">${escapeHtml(spawn.shadow.name)}</div>`,
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
      showToast(`${spawn.shadow.name}: ${tellLabel(spawn).toLowerCase()} ${spawn.hidingSpot.where}, ${Math.round(d)} m away. Get within ${INTERACT_RADIUS_M} m.`);
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
        m = L.marker([s.lat, s.lng], { icon: iconFor(s, near), title: `${s.shadow.name}: ${tellLabel(s).toLowerCase()} ${s.hidingSpot.where}`, riseOnHover: true });
        (m as L.Marker & { _near?: boolean })._near = near;
        m.on('click', () => onTap(s));
        layer.addLayer(m);
        markers.set(s.id, m);
      } else if ((m as L.Marker & { _near?: boolean })._near !== near) {
        m.setIcon(iconFor(s, near));
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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
