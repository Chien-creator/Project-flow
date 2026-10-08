/* STREAMING_CHUNK:Configuring Network-First PWA Service Worker... */
const CACHE_NAME = 'project-flow-v6'; // 升級為 v6

// 1. 安裝：立即強制跳過等待
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. 激活：立即刪除所有舊快取並接管頁面
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // 清除 v1, v2, v3, v4, v5 等舊快取
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 擷取：【網路優先】有網路就拿 GitHub 最新版，沒網路才讀離線快取
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 成功取得網路最新版，順便更新本地快取
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 離線無網路時，讀取快取
        return caches.match(event.request);
      })
  );
});
