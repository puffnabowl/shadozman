import './style.css';
import { PlayerLocator } from './core/geo';
import { createGameMap } from './core/map';
import { loadContent, loadGameplay } from './core/plugins';
import { setupTabs, showGeoStatus } from './core/ui';

const locator = new PlayerLocator();
locator.onStatus(showGeoStatus);

const gameMap = createGameMap(
  document.getElementById('map')!,
  locator,
  document.getElementById('recenter') as HTMLButtonElement
);

const collectionRoot = document.getElementById('collection-root')!;

async function renderCollectionScreen() {
  const gameplay = await loadGameplay();
  if (gameplay) {
    gameplay.renderCollection(collectionRoot);
    return;
  }
  const content = await loadContent();
  const count = content?.SHADOWS.length ?? 0;
  collectionRoot.innerHTML = `<p class="empty">No shadows caught yet.${count ? ` ${count} lurk out there.` : ''}</p>`;
}

setupTabs((screen) => {
  if (screen === 'map') gameMap.map.invalidateSize();
  else renderCollectionScreen();
});

loadGameplay().then((gameplay) => {
  if (!gameplay) {
    console.info('Gameplay module not present yet; running map only.');
    return;
  }
  const game = gameplay.initGameplay(gameMap.map);
  locator.onPosition((p) => game.updatePlayer(p.lat, p.lng));
});

locator.start();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => console.warn('SW registration failed', err));
}
