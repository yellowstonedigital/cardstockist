# Card Stockist

Where to buy trading cards in New Zealand. Astro site, hosted on Cloudflare.

## Where things live

| What | File |
|---|---|
| Store list (one row per store) | `src/data/stores.csv` |
| Games, and which have their own hub pages | `src/data/games.ts` |
| News posts | `src/content/news/*.md` (copy `_example-post.md`) |
| Set and release pages | `src/content/sets/<game>/<set>.md` |
| Look and feel | `src/styles/global.css` |

## Store CSV columns

`name, slug, city, region, type, website, games, singles, events, ships_nz, address, source_url, notes, featured, last_checked`

- `type`: in-person, online, both or chain
- `games`: semicolon separated slugs from `games.ts`, e.g. `pokemon;one-piece`
- `singles`, `events`, `ships_nz`: yes, no or unknown (unknown is hidden on the site)
- `featured`: yes puts the store at the top of every list with a Featured label
- `notes` is internal only and never shown on the site

## Pages it builds

- `/nz/stores/` directory with filters
- `/nz/stores/<city>/` one per city with stores
- `/nz/stores/<store>/` one per store
- `/nz/<game>/where-to-buy/` and `/nz/<game>/releases/` for each hub game
- `/<game>/sets/<set>/` for each set file
- `/news/` and `/news/<post>/`

## Cloudflare settings

Framework preset: Astro. Build command: `npm run build`. Output folder: `dist`.
