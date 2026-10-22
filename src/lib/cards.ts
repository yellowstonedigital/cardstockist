import { parse } from 'csv-parse/sync';

export interface Single { store: string; url: string; priceNzd: number | null; inStock: boolean }
export interface Card {
  num: string; name: string; rarity: string; category: string; image: string | null;
  marketEur: number | null; marketNzd: number | null; singles: Single[];
}
export interface CardSet {
  tcgdexId: string; name: string; official?: number; total?: number; releaseDate?: string;
  fetchedAt: string; priceSource: string; eurToNzd: number; cards: Card[];
}

const files = import.meta.glob<CardSet>('../data/cards/*.json', { eager: true, import: 'default' });
export function getCardSet(id?: string): CardSet | null {
  if (!id) return null;
  return files[`../data/cards/${id}.json`] ?? null;
}

export interface SealedRow { storeSlug: string; storeName: string; product: string; priceNzd: number; status: string; url: string; checked: string }
const sealedFiles = import.meta.glob<string>('../data/sealed/*.csv', { eager: true, query: '?raw', import: 'default' });
export function getSealed(name?: string): SealedRow[] {
  if (!name) return [];
  const raw = sealedFiles[`../data/sealed/${name}.csv`];
  if (!raw) return [];
  const rows: Record<string, string>[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  return rows.map((r) => ({
    storeSlug: r.store_slug, storeName: r.store_name, product: r.product.replace(/^Other:\s*/, ''),
    priceNzd: Number(r.price_nzd), status: r.status, url: r.url, checked: r.checked,
  }));
}

// Rarity order, rarest last, for sorting and filter chips.
export const RARITY_ORDER = [
  'Common', 'Uncommon', 'Rare', 'Double Rare', 'Illustration Rare', 'Ultra Rare',
  'Special Illustration Rare', 'Hyper Rare', 'Mega Hyper Rare',
];
export const rarityRank = (r: string) => {
  const i = RARITY_ORDER.findIndex((x) => x.toLowerCase() === r.toLowerCase());
  return i === -1 ? 0 : i;
};
// Card images go through our own /img/ route (see worker/index.js) so they're cached at the edge.
export const cardImg = (tcgdexImage: string | null, size: 'low' | 'high') =>
  tcgdexImage ? tcgdexImage.replace('https://assets.tcgdex.net/en/', '/img/card/') + `/${size}.webp` : null;
// TCGdex mixes casing ("Special illustration rare"), so normalise to Title Case.
export const rarityLabel = (r: string) => r.replace(/\b\w/g, (ch) => ch.toUpperCase());

export const nzd = (n: number | null | undefined) =>
  n == null ? '' : n < 1 ? 'under $1' : `$${n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// UTM tags so partner stores can see traffic from us in their analytics.
export const trackLink = (url: string, campaign: string) => {
  const u = new URL(url);
  u.searchParams.set('utm_source', 'cardstockist');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', campaign);
  return u.toString();
};
export const STORE_NAMES: Record<string, string> = { getthosecards: 'Getthosecards' };
