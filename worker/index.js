// Serves the static site, plus /img/card/<series>/<set>/<num>/<size>.webp
// which proxies card images from TCGdex and caches them at Cloudflare's edge,
// so visitors get them fast instead of waiting on TCGdex's servers.
const SIZES = new Set(['low', 'high']);
const YEAR = 60 * 60 * 24 * 365;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/img\/card\/([a-z0-9.-]+)\/([a-z0-9.-]+)\/([A-Za-z0-9-]+)\/(low|high)\.webp$/);
    if (!m) return env.ASSETS.fetch(request);
    const [, series, set, num, size] = m;
    if (!SIZES.has(size)) return new Response('Not found', { status: 404 });

    const cache = caches.default;
    const key = new Request(url.toString(), { method: 'GET' });
    const hit = await cache.match(key);
    if (hit) return hit;

    const upstream = await fetch(`https://assets.tcgdex.net/en/${series}/${set}/${num}/${size}.webp`, {
      cf: { cacheTtl: YEAR, cacheEverything: true },
    });
    if (!upstream.ok) return new Response('Image not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=3600' } });

    const res = new Response(upstream.body, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': `public, max-age=${YEAR}, immutable`,
      },
    });
    ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  },
};
