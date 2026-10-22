// Player position source. Uses real GPS when available; falls back to a
// "demo walk" (keyboard/drag controlled) when GPS is denied, unavailable,
// or the URL has ?demo, so the game is playable on a desktop too.

export interface PlayerPosition {
  lat: number;
  lng: number;
  accuracy: number; // metres
  simulated: boolean;
}

export type PositionListener = (pos: PlayerPosition) => void;
export type StatusListener = (status: GeoStatus) => void;
export type GeoStatus = 'locating' | 'gps' | 'demo' | 'error';

// Default demo start: Central Park, NYC.
const DEMO_START = { lat: 40.7812, lng: -73.9665 };
const DEMO_STEP_M = 8;

export class PlayerLocator {
  private listeners: PositionListener[] = [];
  private statusListeners: StatusListener[] = [];
  private watchId: number | null = null;
  private last: PlayerPosition | null = null;
  status: GeoStatus = 'locating';

  onPosition(fn: PositionListener) {
    this.listeners.push(fn);
    if (this.last) fn(this.last);
  }

  onStatus(fn: StatusListener) {
    this.statusListeners.push(fn);
    fn(this.status);
  }

  get position() {
    return this.last;
  }

  start() {
    const forceDemo = new URLSearchParams(location.search).has('demo');
    if (forceDemo || !('geolocation' in navigator)) {
      this.startDemo();
      return;
    }
    this.watchId = navigator.geolocation.watchPosition(
      (p) => {
        this.setStatus('gps');
        this.emit({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, simulated: false });
      },
      (err) => {
        console.warn('Geolocation failed, switching to demo walk:', err.message);
        if (this.last && !this.last.simulated) {
          this.setStatus('error'); // had a fix before; keep last known position
          return;
        }
        this.startDemo();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }

  /** Move the simulated player (demo mode only). */
  nudge(dNorthM: number, dEastM: number) {
    if (this.status !== 'demo' || !this.last) return;
    const dLat = dNorthM / 111_320;
    const dLng = dEastM / (111_320 * Math.cos((this.last.lat * Math.PI) / 180));
    this.emit({ ...this.last, lat: this.last.lat + dLat, lng: this.last.lng + dLng });
  }

  /** Teleport the simulated player (demo mode only). */
  teleport(lat: number, lng: number) {
    if (this.status !== 'demo') return;
    this.emit({ lat, lng, accuracy: 5, simulated: true });
  }

  private startDemo() {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    this.setStatus('demo');
    this.emit({ ...DEMO_START, accuracy: 5, simulated: true });
    window.addEventListener('keydown', (e) => {
      const moves: Record<string, [number, number]> = {
        ArrowUp: [DEMO_STEP_M, 0], w: [DEMO_STEP_M, 0],
        ArrowDown: [-DEMO_STEP_M, 0], s: [-DEMO_STEP_M, 0],
        ArrowLeft: [0, -DEMO_STEP_M], a: [0, -DEMO_STEP_M],
        ArrowRight: [0, DEMO_STEP_M], d: [0, DEMO_STEP_M],
      };
      const m = moves[e.key];
      if (m) {
        e.preventDefault();
        this.nudge(m[0], m[1]);
      }
    });
  }

  private setStatus(s: GeoStatus) {
    if (this.status === s) return;
    this.status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  private emit(pos: PlayerPosition) {
    this.last = pos;
    this.listeners.forEach((fn) => fn(pos));
  }
}
