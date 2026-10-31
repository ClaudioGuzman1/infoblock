// v4 – corrige ERR_FAILED en conexiones lentas (datos móviles).
// Antes: la navegación competía contra un timeout de 3 s; si perdía y no había caché,
// respondWith recibía "undefined" y Chrome mostraba ERR_FAILED.
const CACHE = "offline-v5";
const RUNTIME_CACHE = "runtime-v5";
const basePath = self.location.pathname.replace(/\/[^\/]*$/, '') + '/';
const V = "1.1.0"; // mantener igual al ?v= de index.html

const SHELL = [
  '', 'index.html', 'manifest.json', 'favicon.ico', `styles.css?v=${V}`, 'sw-register.js',
  ...['core/image-store','core/database','core/toast','core/config','core/utils','core/state','orders',
      'pdf/assets','pdf/ods','pdf/idt','pdf/cde','views/render','views/list-view','views/form-view',
      'features/signature','features/entregas','features/backup',
      'cloud/api','cloud/print','cloud/view','cloud/edit','main'].map(m => `js/${m}.js?v=${V}`),
].map(p => basePath + p);

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // uno por uno: si un archivo falla, los demás se guardan igual
      Promise.all(SHELL.map(u => c.add(u).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE && n !== RUNTIME_CACHE).map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

const offlineResponse = () =>
  new Response('Sin conexión y sin copia guardada. Abre la app una vez con buena señal.',
    { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

async function fromCache(req, ignoreSearch = false) {
  return (await caches.match(req, { ignoreSearch })) || null;
}

// Nunca devuelve undefined: siempre una Response válida.
async function networkFirst(req, { navigation = false, timeoutMs = 8000 } = {}) {
  const cached = await fromCache(req, navigation);
  try {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    });
    // Solo se usa el timeout si HAY copia guardada que mostrar; si no, se espera a la red.
    if (cached) {
      return await Promise.race([
        net,
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
      ]);
    }
    return await net;
  } catch (_) {
    if (cached) return cached;
    if (navigation) {
      return (await fromCache(basePath + 'index.html')) || (await fromCache(basePath)) || offlineResponse();
    }
    return offlineResponse();
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navegación (abrir la app): red primero, sin cortar la descarga en redes lentas.
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, { navigation: true }));
    return;
  }

  // Archivos estáticos propios (.js/.css/imágenes): caché primero.
  if (url.origin === self.location.origin && /\.(js|css|png|jpg|jpeg|gif|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cached = await fromCache(req);
      if (cached) return cached;
      return networkFirst(req);
    })());
    return;
  }

  // Todo lo demás (CDN de jsPDF/Tailwind, API de Supabase): red primero con respaldo.
  e.respondWith(networkFirst(req));
});
