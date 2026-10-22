import type { GeoStatus } from './geo';

export type ScreenName = 'map' | 'collection';

export function setupTabs(onShow: (screen: ScreenName) => void) {
  const buttons = document.querySelectorAll<HTMLButtonElement>('#tabbar button');
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const name = btn.dataset.screen as ScreenName;
      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
      onShow(name);
    })
  );
}

const STATUS_TEXT: Record<GeoStatus, string> = {
  locating: 'Locating…',
  gps: 'GPS',
  demo: 'Demo walk · arrows/WASD',
  error: 'GPS lost',
};

export function showGeoStatus(status: GeoStatus) {
  const el = document.getElementById('gps-status')!;
  el.textContent = STATUS_TEXT[status];
  el.dataset.status = status;
}
