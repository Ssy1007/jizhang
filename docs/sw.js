/* ===================================
   记账APP - Service Worker
   提供离线缓存支持
   =================================== */

var CACHE_NAME = 'jizhang-v1';

/* 需要缓存的静态文件 */
var STATIC_FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/storage.js',
  './js/ui.js',
  './js/app.js',
  './manifest.json'
];

/* 安装：预缓存静态文件 */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_FILES);
    })
  );
});

/* 请求拦截：缓存优先策略 */
self.addEventListener('fetch', function (event) {
  // 只拦截 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      // 尝试网络请求并缓存
      return fetch(event.request).then(function (response) {
        // 只缓存成功的响应
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function () {
        // 网络失败且无缓存，返回空
        return new Response('', { status: 504 });
      });
    })
  );
});

/* 激活：清理旧版本缓存 */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) { return name !== CACHE_NAME; })
             .map(function (name) { return caches.delete(name); })
      );
    })
  );
});
