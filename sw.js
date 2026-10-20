// 태블릿에 프로그램을 보관해 두는 작은 일꾼: 인터넷이 되면 새 버전을 받고, 안 되면 보관본으로 엽니다.
// (학생 이름·출석 기록은 여기 없습니다 — 기록은 브라우저 저장소에만 있음)
const CACHE = 'qr-attendance-1.9-1aa7htq';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // 먼저 인터넷에서 받되 4초 안에 안 오면 보관본
  const fromNet = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const fromCache = () => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'));
  e.respondWith(new Promise(resolve => {
    let done = false;
    const timer = setTimeout(() => { fromCache().then(r => { if (r && !done) { done = true; resolve(r); } }); }, 4000);
    fromNet.then(r => { clearTimeout(timer); if (!done) { done = true; resolve(r); } })
      .catch(() => { clearTimeout(timer); fromCache().then(r => { if (!done) { done = true; resolve(r || Response.error()); } }); });
  }));
});
