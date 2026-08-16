/**
 * Service worker: makes the app installable, work offline, and act as an Android
 * share target ("Share → Image to Text" from the gallery).
 *
 * `__VERSION__` / `__PRECACHE__` are substituted by scripts/build.ts. When they are
 * still placeholders (i.e. running straight from `src/`) precaching is skipped and
 * only runtime caching applies, so development never serves stale files.
 */
const VERSION = "c07646c5";
const PRECACHE = ["./", "./index.html", "./app-pergjqgq.js", "./styles-fe7557d7.css", "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-192.png", "./icons/favicon-32.png"];
const BUILT = !PRECACHE.includes('__PRECACHE__');

const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = 'assets-v1'; // big, content-stable files: OCR runtime + models
const SHARE_CACHE = 'shared-image';

const isAsset = (url) => url.pathname.includes('/vendor/') || url.pathname.includes('/icons/');
const isModel = (url) => url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('tesseract.js-data');

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      if (BUILT) {
        const cache = await caches.open(SHELL_CACHE);
        await cache.addAll(PRECACHE);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE, SHARE_CACHE]);
      await Promise.all(
        (await caches.keys()).filter((key) => !keep.has(key)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Android share sheet posts the image here (see manifest share_target).
  if (request.method === 'POST' && url.pathname.endsWith('/share')) {
    event.respondWith(receiveShare(request));
    return;
  }

  if (request.method !== 'GET') return;

  // The OCR core and language models are ~12 MB and never change for a given
  // version, so serve them from cache and only hit the network on a miss.
  if ((url.origin === self.location.origin && isAsset(url)) || isModel(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // App shell: instant from cache, refreshed in the background.
  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((response) => {
      if (response.ok && BUILT) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (hit) return hit;
  const response = await network;
  if (response) return response;
  // Offline navigation with a cold cache for this exact URL: fall back to the shell.
  if (request.mode === 'navigate') {
    const shell = await cache.match('./index.html', { ignoreSearch: true });
    if (shell) return shell;
  }
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}

/**
 * Stash the shared image in a cache and bounce the navigation back to the app,
 * which picks it up on load. A cache entry is used as the hand-off because the
 * share POST and the page that consumes it are two separate navigations.
 */
async function receiveShare(request) {
  const home = new URL('./', self.registration.scope);
  try {
    const form = await request.formData();
    const file = form.get('image') ?? [...form.values()].find((v) => typeof v === 'object');
    if (file) {
      const cache = await caches.open(SHARE_CACHE);
      await cache.put(
        SHARE_CACHE,
        new Response(file, { headers: { 'content-type': file.type || 'application/octet-stream' } }),
      );
      home.searchParams.set('shared', '1');
    }
  } catch (error) {
    console.warn('share failed', error);
  }
  return Response.redirect(home.href, 303);
}
