// Keeps the app usable offline and never makes you wait on a bad connection.
// Same-origin files: network first, but if the network is slower than 2.5 s (or down), the saved copy is used at once.
const C = 'vocab-v3';
const PRE = ['./', 'index.html', 'sets.json'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(async c => {
    await Promise.all(PRE.map(u => c.add(u).catch(() => {})));
    try { const j = await (await fetch('sets.json', { cache: 'no-cache' })).json(); await Promise.all((j.sets || []).map(u => c.add(u).catch(() => {}))); } catch (x) {}
  }));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === location.origin;
  e.respondWith(caches.open(C).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = () => fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(e.request, r.clone()); return r; });
    if (same) {
      if (!hit) return net().catch(() => Response.error());
      return Promise.race([net().catch(() => hit), new Promise(res => setTimeout(() => res(hit), 2500))]);
    }
    return hit || net().catch(() => Response.error());   // fonts etc.: saved copy first
  }));
});