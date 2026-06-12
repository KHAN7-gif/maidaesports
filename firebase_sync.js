/* ═══════════════════════════════════════════════════════════
   MAIDA ESPORTS — FIREBASE REST API v4
   Tiada SDK, guna fetch() sahaja — berfungsi di semua browser
   GitHub Pages, mobile, desktop — semua OK
═══════════════════════════════════════════════════════════ */

var _FB = {
  base: "https://maida-esports-default-rtdb.asia-southeast1.firebasedatabase.app",
  poll: {},    /* polling intervals for listeners */
  last: {},    /* last known values for change detection */
  ok:   false  /* connection status */
};

/* ── WRITE ── */
function fbSet(path, data, onOk, onErr) {
  fetch(_FB.base + "/" + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(function(r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(function() { _FB.ok = true; if (onOk) onOk(); })
  .catch(function(e) { console.warn("[FB set] " + path, e); if (onErr) onErr(e); });
}

/* ── UPDATE (merge) ── */
function fbUpdate(path, data, onOk, onErr) {
  fetch(_FB.base + "/" + path + ".json", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(function(r) { return r.json(); })
  .then(function() { if (onOk) onOk(); })
  .catch(function(e) { if (onErr) onErr(e); });
}

/* ── READ ONCE ── */
function fbGet(path, cb, onErr) {
  fetch(_FB.base + "/" + path + ".json")
  .then(function(r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(function(d) { _FB.ok = true; if (cb) cb(d); })
  .catch(function(e) {
    console.warn("[FB get] " + path, e);
    _FB.ok = false;
    if (onErr) onErr(e);
    else if (cb) cb(null);
  });
}

/* ── REALTIME LISTENER (polling setiap 2 saat) ── */
function fbListen(path, cb, interval) {
  fbUnlisten(path);
  var ms = (interval || 2) * 1000;
  /* fetch sekali dulu */
  fbGet(path, function(d) {
    _FB.last[path] = JSON.stringify(d);
    cb(d);
  });
  /* then poll */
  _FB.poll[path] = setInterval(function() {
    fbGet(path, function(d) {
      var str = JSON.stringify(d);
      if (str !== _FB.last[path]) {
        _FB.last[path] = str;
        cb(d);
      }
    });
  }, ms);
}

/* ── STOP LISTENER ── */
function fbUnlisten(path) {
  if (_FB.poll[path]) {
    clearInterval(_FB.poll[path]);
    delete _FB.poll[path];
    delete _FB.last[path];
  }
}

/* ── LISTEN ROOT ── */
function fbListenAll(cb) { fbListen("maida", cb, 2); }

/* ── SAVE ALL ── */
function fbSaveAll(data, onOk) {
  fbSet("maida", data, onOk);
  try { localStorage.setItem("_fb_bk", JSON.stringify(data)); } catch(e) {}
}

/* ── LOAD ALL ── */
function fbLoadAll(cb) {
  fbGet("maida", function(d) {
    if (d) { cb(d); return; }
    try {
      var b = localStorage.getItem("_fb_bk");
      cb(b ? JSON.parse(b) : null);
    } catch(e) { cb(null); }
  });
}

/* ── CHECK STATUS ── */
function fbCheckStatus(cb) {
  fbGet(".info/connected", function(d) {
    cb(_FB.ok);
  });
  /* Also verify with a real path */
  fetch(_FB.base + "/maida_ping.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Date.now())
  })
  .then(function() { _FB.ok = true; cb(true); })
  .catch(function() { _FB.ok = false; cb(false); });
}

/* ── COMPAT: fbWhenReady / fbOnReady ── */
/* REST API is always "ready" — just call immediately */
function fbWhenReady(fn) { fn(); }
function fbOnReady(fn)   { fn(); }

console.log("[Firebase REST] Module loaded ✓");
