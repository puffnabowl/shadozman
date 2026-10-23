# Shadozman content

All creatures, art and visual style for Shadozman. Everything here is original.

- `types.ts`: `ShadowType` and friends.
- `shadows.ts`: the 20-species roster (`SHADOWS`, `getShadow`), rarity tables (`RARITY_WEIGHT`, `RARITY_COLOR`, `RARITY_LABEL`), and time helpers (`timeOfDay`, `canSpawnAt`).
- `theme.css`: CSS variables and small helpers (`.sz-rarity`, `.sz-portrait`, `.sz-drift`).
- `public/shadows/tells/<id>.svg`: just the tell (eyes, hands or smile) you spot first, for map markers and the hunt reveal.
- `public/shadows/<id>.svg`: one 256×256 transparent portrait per species. `shadow.art` already resolves against Vite's `BASE_URL`.
- `public/icons/`: app icon (`icon.svg`, `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`).

## Roster

| # | Name (id) | Rarity | Tell | When | Where |
|---|------|--------|------|------|-------|
| 1 | Blind Peeker Pete (`lurkling`) | common | eyes | dusk, night | urban, residential |
| 2 | Day Five Dave (`hallwalker`) | common | eyes | night | residential |
| 3 | Sketchy Light Larry (`flicker`) | common | smile | dusk, night | urban |
| 4 | Peripheral Paul (`smudge`) | common | smile | day, dusk | any |
| 5 | Basement Bobby (`stairbottom`) | common | hands | night | residential |
| 6 | Puddle Spun Steve (`puddlegaunt`) | common | hands | dawn, dusk, night | water, urban |
| 7 | Hat Man Stan (`brimwarden`) | uncommon | smile | night, witching | urban |
| 8 | Chest Gremlin Greg (`sleepsitter`) | uncommon | eyes | witching | residential |
| 9 | Bush Cop Carl (`pinewatch`) | uncommon | eyes | dusk, night | park |
| 10 | Scrap Metal Mike (`rustwraith`) | uncommon | hands | night, witching | industrial |
| 11 | Bench Warrant Barry (`benchling`) | uncommon | hands | day, dusk | park |
| 12 | Lamp Post Lenny (`lamplanky`) | rare | hands | night, witching | urban, residential |
| 13 | Graveyard Shift Gary (`graveshade`) | rare | hands | night, witching | cemetery |
| 14 | Captain No-Sleep (`ferrymute`) | rare | eyes | dawn, dusk | water |
| 15 | Balloon String Benny (`hollowchild`) | rare | smile | dusk | park, residential |
| 16 | The Hoodie Trio (`hooded-choir`) | epic | smile | witching | cemetery |
| 17 | Mirror Mirror Marty (`mirrorkin`) | epic | eyes | dusk, night | urban |
| 18 | Tinfoil Tammy (`static-mother`) | epic | smile | witching | industrial, urban |
| 19 | The Big Comedown (`the-unlit`) | legendary | eyes | witching | any |
| 20 | King Spun the First (`duskcrown`) | legendary | smile | dusk | any |

Every time bucket has at least one species (day: Peripheral Paul, Bench Warrant Barry), so the map is never empty.
`witching` (00:00–03:59) also admits `night` species via `canSpawnAt`.

## Style

Ink-black wispy silhouettes (`#0a0910`) with a soft colored rim light and glowing eyes in the species' `glow` color, on a deep violet night (`#07060c` → `#120d22`). Props are flat dark grays. Headings use Cinzel, body uses Inter. No gore and nothing meant to be truly scary: eerie, a bit melancholy, a bit funny.

## Regenerating art

`python3 tools/gen_art.py` rewrites every SVG (glow colors are read from `shadows.ts`). `python3 tools/gen_tells.py` rewrites the tells. `node tools/icons.mjs public/icons` re-rasterizes the PNG icons (needs Playwright).
