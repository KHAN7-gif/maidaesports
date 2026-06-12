/* ═══════════════════════════════════════════════════════════
   MAIDA ESPORTS — FIREBASE REALTIME DATABASE SYNC v5
   REST API (fetch) — tiada SDK, percuma, tanpa billing.

   SETUP (Firebase Console):
   1. Build → Realtime Database → Create Database
   2. Pilih lokasi (cth: asia-southeast1)
   3. Start in test mode:
      { "rules": { ".read": true, ".write": true } }
   4. Catat URL database, isi DB_URL di bawah
═══════════════════════════════════════════════════════════ */

var DB_URL = "https://maida-esports-ca555-default-rtdb.asia-southeast1.firebasedatabase.app";

var _FB = {
  poll: {},
  last: {},
  ok: false
};

/* ── WRITE (overwrite path) ── */
function fsSet(path, data, onOk, onErr){
  fetch(DB_URL + "/" + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(function(r){
    if(!r.ok) return r.text().then(function(t){ throw new Error("HTTP "+r.status+": "+t.substring(0,200)); });
    return r.json();
  })
  .then(function(){ _FB.ok = true; if(onOk) onOk(); })
  .catch(function(e){ console.warn("[FB set] "+path, e); if(onErr) onErr(e); });
}

/* ── READ ONCE ── */
function fsGet(path, cb, onErr){
  fetch(DB_URL + "/" + path + ".json")
  .then(function(r){
    _FB.ok = true;
    if(!r.ok) return r.text().then(function(t){ throw new Error("HTTP "+r.status+": "+t.substring(0,200)); });
    return r.json();
  })
  .then(function(data){ if(cb) cb(data); })
  .catch(function(e){
    console.warn("[FB get] "+path, e);
    if(onErr) onErr(e); else if(cb) cb(null);
  });
}

/* ── REALTIME LISTENER (polling) ── */
function fsListen(path, cb, interval){
  fsUnlisten(path);
  var ms = (interval || 2) * 1000;
  fsGet(path, function(d){ _FB.last[path] = JSON.stringify(d); cb(d); });
  _FB.poll[path] = setInterval(function(){
    fsGet(path, function(d){
      var str = JSON.stringify(d);
      if(str !== _FB.last[path]){ _FB.last[path] = str; cb(d); }
    });
  }, ms);
}
function fsUnlisten(path){
  if(_FB.poll[path]){ clearInterval(_FB.poll[path]); delete _FB.poll[path]; delete _FB.last[path]; }
}

/* ── CHECK STATUS ── */
function fsCheckStatus(cb){
  fetch(DB_URL + "/maida_ping.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Date.now())
  })
  .then(function(r){ _FB.ok = r.ok; cb(r.ok); })
  .catch(function(){ _FB.ok = false; cb(false); });
}

/* ── COMPAT ALIASES (sama API dgn kod sedia ada) ── */
function fbSet(path, data, onOk, onErr){ fsSet(path, data, onOk, onErr); }
function fbGet(path, cb, onErr){ fsGet(path, cb, onErr); }
function fbListen(path, cb, interval){ fsListen(path, cb, interval); }
function fbUnlisten(path){ fsUnlisten(path); }
function fbCheckStatus(cb){ fsCheckStatus(cb); }
function fbWhenReady(fn){ fn(); }
function fbOnReady(fn){ fn(); }
function fbListenAll(cb){ fsListen("maida", cb, 2); }
function fbSaveAll(data, onOk){
  fsSet("maida", data, onOk);
  try{ localStorage.setItem("_fb_bk", JSON.stringify(data)); }catch(e){}
}
function fbLoadAll(cb){
  fsGet("maida", function(d){
    if(d){ cb(d); return; }
    try{ var b = localStorage.getItem("_fb_bk"); cb(b ? JSON.parse(b) : null); }catch(e){ cb(null); }
  });
}

console.log("[Firebase RTDB] Module loaded ✓ —", DB_URL);
