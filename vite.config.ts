import { defineConfig } from 'vite';

// base can be overridden at build time for hosts that serve from a subpath
// (e.g. GitHub Pages: BASE_PATH=/shadozman/ npm run build).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
});
