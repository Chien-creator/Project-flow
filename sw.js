// 1. 版本設定：未來更新 index.html 時，只需修改此處的版本號 (例如 'v7', 'v8')
const CACHE_PREFIX = 'project-flow-';
const CACHE_VERSION = 'v7';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// 2. 安裝階段：立即跳過等待，讓新的 Service Worker 優先準備接管頁面
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 3. 啟動階段：自動識別並一次清除「所有」非當前版本的歷史舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          // 自動過濾出所有專案相關 (project-flow-*) 但非當前版本的舊快取 (不論舊版本有多少個)
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)) // 一行程式碼徹底清除所有歷史舊版
      );
    }).then(() => self.clients.claim())
  );
});

// 4. 擷取階段：採用【網路優先 (Network First)】策略
self.addEventListener('fetch', (event) => {
  // 僅處理 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 成功取得網路最新版，同步更新至當前版本的快取中
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 離線無網路時，自動降級讀取本地快取
        return caches.match(event.request);
      })
  );
});
