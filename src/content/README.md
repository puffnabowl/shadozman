# Shadozman content

All creatures, art and visual style for Shadozman. Everything here is original.

- `types.ts`: `ShadowType` and friends.
- `shadows.ts`: the 20-species roster (`SHADOWS`, `getShadow`), rarity tables (`RARITY_WEIGHT`, `RARITY_COLOR`, `RARITY_LABEL`), and time helpers (`timeOfDay`, `canSpawnAt`).
- `theme.css`: CSS variables and small helpers (`.sz-rarity`, `.sz-portrait`, `.sz-drift`).
- `public/shadows/<id>.svg`: one 256×256 transparent portrait per species. `shadow.art` already resolves against Vite's `BASE_URL`.
- `public/icons/`: app icon (`icon.svg`, `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`).

## Roster

| # | Name | Rarity | When | Where |
|---|------|--------|------|-------|
| 1 | Lurkling | common | dusk, night | urban, residential |
| 2 | Hallwalker | common | night | residential |
| 3 | Flicker | common | dusk, night | urban |
| 4 | Smudge | common | day, dusk | any |
| 5 | Stairbottom | common | night | residential |
| 6 | Puddlegaunt | common | dawn, dusk, night | water, urban |
| 7 | Brimwarden | uncommon | night, witching | urban |
| 8 | Sleepsitter | uncommon | witching | residential |
| 9 | Pinewatch | uncommon | dusk, night | park |
| 10 | Rustwraith | uncommon | night, witching | industrial |
| 11 | Benchling | uncommon | day, dusk | park |
| 12 | Lamplanky | rare | night, witching | urban, residential |
| 13 | Graveshade | rare | night, witching | cemetery |
| 14 | Ferrymute | rare | dawn, dusk | water |
| 15 | Hollowchild | rare | dusk | park, residential |
| 16 | Hooded Choir | epic | witching | cemetery |
| 17 | Mirrorkin | epic | dusk, night | urban |
| 18 | Static Mother | epic | witching | industrial, urban |
| 19 | The Unlit | legendary | witching | any |
| 20 | Duskcrown | legendary | dusk | any |

Every time bucket has at least one species (day: Smudge, Benchling), so the map is never empty.
`witching` (00:00–03:59) also admits `night` species via `canSpawnAt`.

## Style

Ink-black wispy silhouettes (`#0a0910`) with a soft colored rim light and glowing eyes in the species' `glow` color, on a deep violet night (`#07060c` → `#120d22`). Props are flat dark grays. Headings use Cinzel, body uses Inter. No gore and nothing meant to be truly scary: eerie, a bit melancholy, a bit funny.

## Regenerating art

`python3 tools/gen_art.py` rewrites every SVG (glow colors are read from `shadows.ts`). `node tools/icons.mjs public/icons` re-rasterizes the PNG icons (needs Playwright).
