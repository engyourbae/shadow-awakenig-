/* Shadow Awakening: Distorsi - Service Worker
   Strategi:
   - Halaman (navigasi)      : jaringan dulu (maks 3,5 dtk), jika offline pakai salinan cache
   - File game/ikon (1 domain): cache dulu, perbarui diam-diam di belakang (stale-while-revalidate)
   - Google Fonts             : cache dulu (font tidak berubah)
   Nilai BUILD diganti otomatis oleh GitHub Actions (lihat .github/workflows/pages.yml).
   Jika upload manual, ganti BUILD secara manual tiap kali merilis versi baru agar pemain mendapat pembaruan. */
const BUILD = '__BUILD__';
const VERSION = 'sa-' + BUILD;
const RUNTIME = VERSION + '-rt';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'favicon.ico',
  'icons/favicon.svg', 'icons/logo.svg',
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/maskable-192.png', 'icons/maskable-512.png',
  'icons/apple-touch-icon.png'
];
const MAX_RUNTIME = 60;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.allSettled(CORE.map((u) => c.add(new Request(u, { cache: 'reload' }))));
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('sa-') && !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

async function trim(name, max) {
  const c = await caches.open(name), ks = await c.keys();
  if (ks.length > max) await Promise.all(ks.slice(0, ks.length - max).map((k) => c.delete(k)));
}

function timeout(ms) { return new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms)); }

async function navigate(req) {
  const c = await caches.open(VERSION);
  try {
    const res = await Promise.race([fetch(req), timeout(3500)]);
    if (res && res.ok) c.put('index.html', res.clone());
    return res;
  } catch (_) {
    return (await c.match(req, { ignoreSearch: true })) || (await c.match('index.html')) || (await c.match('./')) ||
      new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function swr(req, cacheName) {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  const net = fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) { c.put(req, res.clone()); if (cacheName === RUNTIME) trim(RUNTIME, MAX_RUNTIME); }
    return res;
  }).catch(() => null);
  return hit || (await net) || new Response('', { status: 504 });
}

async function cacheFirst(req) {
  const c = await caches.open(RUNTIME);
  const hit = await c.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) { c.put(req, res.clone()); trim(RUNTIME, MAX_RUNTIME); }
    return res;
  } catch (_) { return new Response('', { status: 504 }); }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') { e.respondWith(navigate(req)); return; }
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/sw.js')) return;
    e.respondWith(swr(req, VERSION));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com') { e.respondWith(swr(req, RUNTIME)); return; }
  if (url.hostname === 'fonts.gstatic.com') { e.respondWith(cacheFirst(req)); return; }
});
