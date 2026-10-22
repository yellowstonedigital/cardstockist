import { parse } from 'csv-parse/sync';
import { gameBySlug } from '../data/games';
import raw from '../data/stores.csv?raw';

// One row per store in src/data/stores.csv. The `notes` column is internal
// and is never shown on the site.
export type Tri = 'yes' | 'no' | 'unknown';
export type StoreType = 'in-person' | 'online' | 'both' | 'chain';

export interface Store {
  name: string;
  slug: string;
  city: string;
  citySlug: string;
  region: string;
  type: StoreType;
  website: string;
  games: string[];
  singles: Tri;
  events: Tri;
  shipsNz: Tri;
  address: string;
  featured: boolean;
  lastChecked: string;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const tri = (v: string): Tri => (v === 'yes' || v === 'no' ? v : 'unknown');

let cache: Store[] | null = null;

export function getStores(): Store[] {
  if (cache) return cache;
  const rows: Record<string, string>[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  cache = rows
    .filter((r) => r.name)
    .map((r) => ({
      name: r.name,
      slug: r.slug || slugify(r.name),
      city: r.city,
      citySlug: slugify(r.city),
      region: r.region,
      type: (r.type || 'both') as StoreType,
      website: r.website,
      games: (r.games || '').split(';').map((g) => g.trim()).filter((g) => gameBySlug(g)),
      singles: tri(r.singles),
      events: tri(r.events),
      shipsNz: tri(r.ships_nz),
      address: r.address,
      featured: r.featured === 'yes',
      lastChecked: r.last_checked,
    }))
    // Featured first, then alphabetical.
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
  return cache;
}

export const independents = () => getStores().filter((s) => s.type !== 'chain');
export const chains = () => getStores().filter((s) => s.type === 'chain');

export interface City { name: string; slug: string; region: string; count: number }

// Cities with at least one store (chains excluded). Biggest first.
export function getCities(): City[] {
  const map = new Map<string, City>();
  for (const s of independents()) {
    const c = map.get(s.citySlug) ?? { name: s.city, slug: s.citySlug, region: s.region, count: 0 };
    c.count++;
    map.set(s.citySlug, c);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export const storesSelling = (game: string) => independents().filter((s) => s.games.includes(game));

export const typeLabel: Record<StoreType, string> = {
  'in-person': 'Walk-in store',
  online: 'Online only',
  both: 'Store + online',
  chain: 'National retailer',
};

export function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
}
