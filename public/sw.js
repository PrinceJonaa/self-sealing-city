const CACHE_VERSION = 'self-sealing-city-v6';
const CORE = [
  './',
  './index.html',
  './city.html',
  './manifest.webmanifest',
  './robots.txt',
  './llms.txt',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

async function warmAppShell() {
  const cache = await caches.open(CACHE_VERSION);
  const pages = await Promise.all(['./index.html', './city.html'].map(async (path) => {
    const response = await fetch(new Request(path, { cache: 'reload' }));
    if (!response.ok) throw new Error(`Unable to cache ${path}`);
    await cache.put(path, response.clone());
    return { path, response };
  }));
  await cache.put('./', pages[0].response.clone());
  const discovered = [];
  for (const page of pages) {
    const html = await page.response.text();
    discovered.push(...[...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map((match) => match[1])
      .filter((path) => !path.startsWith('data:') && !path.startsWith('#'))
      .map((path) => new URL(path, self.registration.scope))
      .filter((url) => url.origin === self.location.origin)
      .map((url) => url.href));
  }
  const targets = [...CORE, ...discovered].map((path) => new URL(path, self.registration.scope).href);
  await cache.addAll([...new Set(targets)]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(warmAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('./')) || (await caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
