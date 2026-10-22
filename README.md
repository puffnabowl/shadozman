# Shadozman

Walk the real world and catch the shadow people hiding in it. A mobile-first
web PWA: Vite + TypeScript, Leaflet with OpenStreetMap data, browser GPS.

## Run

    npm install
    npm run dev          # open on your phone via the LAN URL, or add ?demo on desktop
    npm run build        # outputs dist/; set BASE_PATH=/<repo>/ for GitHub Pages

GPS needs HTTPS (or localhost). If GPS is denied or unavailable, or the URL has
`?demo`, the app runs a demo walk: arrow keys / WASD move the player, and a
right click or long press on the map teleports them.

## Layout

    src/main.ts          bootstraps everything
    src/core/            owned by the core app: map, geolocation, tabs, seams
      contracts.ts       the interfaces other modules implement
      plugins.ts         optional loading of gameplay and content
    src/gameplay/        spawning and catching (exports initGameplay, renderCollection, getCollection)
    src/content/         shadow people data, art and theme (shadows.ts, types.ts, theme.css)
    public/              manifest, service worker, icons/, shadows/*.svg

Core loads `src/gameplay/index.ts` and `src/content/shadows.ts` only if they
exist, so each module can land independently.
