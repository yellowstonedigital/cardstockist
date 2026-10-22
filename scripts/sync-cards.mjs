// Refreshes card lists, market prices and Getthosecards singles before each build.
// Runs automatically via `npm run build` (prebuild). If any source fails, the
// last saved snapshot in src/data/cards/ is kept, so a build never breaks.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CONFIG = JSON.parse(readFileSync(new URL('../src/data/card-sets.json', import.meta.url), 'utf8'));
const OUT = (id) => new URL(`../src/data/cards/${id}.json`, import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'cardstockist.com build (hello@cardstockist.com)' } });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch {}
    await sleep(500 * i);
  }
  throw new Error(`Failed: ${url}`);
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

async function fxEurToNzd(fallback) {
  try {
    const d = await getJson('https://api.frankfurter.dev/v1/latest?from=EUR&to=NZD');
    return d?.rates?.NZD ?? fallback;
  } catch { return fallback; }
}

// Getthosecards tags each single with the set code (e.g. ME05) and a tag of
// card number + set size (e.g. 120084 for 120/084).
async function getthosecards(collection) {
  const map = new Map();
  for (let page = 1; page <= 40; page++) {
    const d = await getJson(`https://getthosecards.co.nz/collections/${collection}/products.json?limit=250&page=${page}`);
    if (!d?.products?.length) break;
    for (const p of d.products) {
      if (p.product_type !== 'Pokemon Single') continue;
      const setTag = p.tags.find((t) => /^[A-Z]{2,4}\d{1,2}(\.\d)?$/.test(t));
      const numTag = p.tags.find((t) => /^\d{5,7}$/.test(t));
      if (!setTag || !numTag) continue;
      const num = numTag.slice(0, 3);
      const prices = p.variants.map((v) => Number(v.price)).filter((n) => n > 0);
      map.set(`${setTag}:${num}`, {
        store: 'getthosecards',
        url: `https://getthosecards.co.nz/products/${p.handle}`,
        priceNzd: prices.length ? Math.min(...prices) : null,
        inStock: p.variants.some((v) => v.available),
      });
    }
    await sleep(300);
  }
  return map;
}

async function main() {
  const prev = (id) => (existsSync(OUT(id)) ? JSON.parse(readFileSync(OUT(id), 'utf8')) : null);
  const fx = await fxEurToNzd(prev(CONFIG.sets[0]?.tcgdexId)?.eurToNzd ?? 1.97);
  let gtc = new Map();
  try { gtc = await getthosecards(CONFIG.getthosecardsCollection); }
  catch (e) { console.warn('[sync-cards] Getthosecards skipped:', e.message); }
  console.log(`[sync-cards] EUR→NZD ${fx}, Getthosecards singles matched: ${gtc.size}`);

  for (const s of CONFIG.sets) {
    try {
      const set = await getJson(`https://api.tcgdex.net/v2/en/sets/${s.tcgdexId}`);
      if (!set) { console.log(`[sync-cards] ${s.tcgdexId}: not in TCGdex yet, skipping`); continue; }
      const cards = await pool(set.cards, 8, async (c) => {
        const d = await getJson(`https://api.tcgdex.net/v2/en/cards/${c.id}`);
        const eur = d?.pricing?.cardmarket?.trend ?? d?.pricing?.cardmarket?.avg ?? null;
        const single = gtc.get(`${s.storeSetCode}:${String(d.localId).padStart(3, '0')}`);
        return {
          num: d.localId,
          name: d.name,
          rarity: d.rarity ?? '',
          category: d.category ?? '',
          image: d.image ?? null,
          marketEur: eur,
          marketNzd: eur != null ? Math.round(eur * fx * 100) / 100 : null,
          singles: single ? [single] : [],
        };
      });
      const keepSingles = gtc.size === 0 ? prev(s.tcgdexId) : null;
      if (keepSingles) for (const c of cards) c.singles = keepSingles.cards.find((o) => o.num === c.num)?.singles ?? [];
      writeFileSync(OUT(s.tcgdexId), JSON.stringify({
        tcgdexId: s.tcgdexId, name: set.name, official: set.cardCount?.official, total: set.cardCount?.total,
        releaseDate: set.releaseDate, fetchedAt: new Date().toISOString(),
        priceSource: 'Cardmarket trend via TCGdex', eurToNzd: fx, cards,
      }, null, 1));
      console.log(`[sync-cards] ${s.tcgdexId}: ${cards.length} cards, ${cards.filter((c) => c.singles.length).length} with singles`);
    } catch (e) {
      console.warn(`[sync-cards] ${s.tcgdexId}: kept previous snapshot (${e.message})`);
    }
  }
}

main().catch((e) => { console.warn('[sync-cards] skipped:', e.message); });
