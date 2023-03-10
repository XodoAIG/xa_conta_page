'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "b46f063fd368e665bac6c77930f3b5db",
"favicon.ico": "8d4ce4564529e7222760de5454aeed97",
"index.html": "93e6309d2631106237335f9f9fa9cba6",
"/": "93e6309d2631106237335f9f9fa9cba6",
"main.dart.js": "084e334e26b3e5d26199dd963dbb4383",
"flutter.js": "a85fcf6324d3c4d3ae3be1ae4931e9c5",
"icons/apple-touch-icon.png": "5defce1495eb4ed5f68d9c92e01db744",
"icons/icon-192.png": "fd312d96fd8d1f7200f435d7c142c265",
"icons/icon-192-maskable.png": "7e0ac44f0ca2bca0941ca70351b6df58",
"icons/icon-512-maskable.png": "5ada75e6df463c9465470d085818ea29",
"icons/icon-512.png": "e7d7402bcaf5a088f46883500cd5d307",
"manifest.json": "7b3a5e070d8031ca259b1c83748ef449",
"main.dart.js_1.part.js": "915e20e8c156d9276cc6f54028247fb0",
"assets/AssetManifest.json": "b0ededcf9cd176a9e29ca37ac011a55a",
"assets/NOTICES": "2b1cb66ee57175a88fe996a5ef5b631e",
"assets/FontManifest.json": "cf3c681641169319e61b61bd0277378f",
"assets/packages/material_design_icons_flutter/lib/fonts/materialdesignicons-webfont.ttf": "dd74f11e425603c7adb66100f161b2a5",
"assets/fonts/MaterialIcons-Regular.otf": "e7069dfd19b331be16bed984668fe080",
"assets/assets/images/xa-logo.svg": "16d244668458c5ce266c66e1b7450be5",
"assets/assets/images/bandeiras/branca-ico.svg": "61dfb86a505a88d2af7eae4a067bc6ec",
"assets/assets/images/bandeiras/anp-ico.svg": "d941fc5271edca25a287f6ab2975eaf8",
"assets/assets/images/bandeiras/shell-ico.svg": "006b7f6ca132defe2efc191e0d0fc94c",
"assets/assets/images/bandeiras/total-ico.svg": "9b540439d040ab639c35976cc627b454",
"assets/assets/images/bandeiras/prime-ico.svg": "0ae5263ab10fa4bb21eeded0dcc8face",
"assets/assets/images/bandeiras/ipiranga-ico.svg": "099b7c8f22564e9fccda8df34952458b",
"assets/assets/images/bandeiras/ale-ico.svg": "ca56b9abf30657c060d13fb0e7c7cbf8",
"assets/assets/images/bandeiras/petrobras-ico.svg": "2606fd64ab3e8bbfc350a2b46f5f3c56",
"assets/assets/images/bandeiras/vip-ico.svg": "7885c6f0f17ec34cdc7734e38b72d323",
"assets/assets/images/bandeiras/pix-ico.svg": "4018d22900a87b1148d2752ec59e33f7",
"assets/assets/images/bandeiras/picpay-ico.svg": "899bc7b253d346fe0cd26d788e74e42d",
"canvaskit/canvaskit.js": "97937cb4c2c2073c968525a3e08c86a3",
"canvaskit/profiling/canvaskit.js": "c21852696bc1cc82e8894d851c01921a",
"canvaskit/profiling/canvaskit.wasm": "371bc4e204443b0d5e774d64a046eb99",
"canvaskit/canvaskit.wasm": "3de12d898ec208a5f31362cc00f09b9e"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
