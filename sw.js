var CACHE = 'lcr-v3';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL).catch(function(){}); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('message', function(e){ if(e.data==='skipWaiting') self.skipWaiting(); });

function isHTML(req){
  return req.mode==='navigate' || (req.headers.get('accept')||'').indexOf('text/html')>-1;
}
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  if(url.origin!==location.origin) return; // Firebase/gstatic/OpenFoodFacts van directos a la red
  if(isHTML(req)){
    // red primero: la app siempre fresca si hay conexión; caché si no
    e.respondWith(
      fetch(req).then(function(res){ var cp=res.clone(); caches.open(CACHE).then(function(c){ c.put('./index.html', cp); }); return res; })
        .catch(function(){ return caches.match('./index.html').then(function(r){ return r || caches.match('./'); }); })
    );
    return;
  }
  // estáticos: caché primero y refresco en segundo plano
  e.respondWith(
    caches.match(req).then(function(cached){
      var net = fetch(req).then(function(res){
        if(res && res.status===200){ var cp=res.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }
        return res;
      }).catch(function(){ return cached; });
      return cached || net;
    })
  );
});
