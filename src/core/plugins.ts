import type { ContentModule, GameplayModule } from './contracts';

// import.meta.glob returns an empty object when a file is missing, which lets
// the core app build before the gameplay and content modules land.
const gameplayLoaders = import.meta.glob<GameplayModule>('../gameplay/index.ts');
const contentLoaders = import.meta.glob<ContentModule>('../content/shadows.ts');
import.meta.glob('../content/theme.css', { eager: true });

async function loadFirst<T>(loaders: Record<string, () => Promise<T>>): Promise<T | null> {
  const load = Object.values(loaders)[0];
  if (!load) return null;
  try {
    return await load();
  } catch (err) {
    console.error('Failed to load module', err);
    return null;
  }
}

export const loadGameplay = () => loadFirst(gameplayLoaders);
export const loadContent = () => loadFirst(contentLoaders);
