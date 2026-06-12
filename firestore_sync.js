/* ═══════════════════════════════════════════════════════════
   MAIDA ESPORTS — CLOUD FIRESTORE SYNC v1
   Guna Firestore REST API — data disimpan sebagai JSON string
   dalam satu field "json" untuk setiap dokumen.

   SETUP (Firebase Console):
   1. Build → Firestore Database → Create database
   2. Pilih "Start in test mode" (rules: allow read,write: if true)
   3. Region: asia-southeast1 (atau mana-mana)
   4. Tiada perlu config tambahan — guna projectId sahaja
═══════════════════════════════════════════════════════════ */

var _FS = {
  project: "maida-esports",
  base: "https://firestore.googleapis.com/v1/projects/maida-esports/databases/(default)/documents",
  poll: {},
  last: {},
  ok: false
};

/* ── Encode JS object as Firestore document fields ── */
function _fsEncode(data){
  return { fields: { json: { stringValue: JSON.stringify(data) } } };
}

/* ── Decode Firestore document response back to JS object ── */
function _fsDecode(doc){
  try{
    if(doc && doc.fields && doc.fields.json && doc.fields.json.stringValue !== undefined){
      return JSON.parse(doc.fields.json.stringValue);
    }
  }catch(e){ console.warn("[FS decode]", e); }
  return null;
}

/* ── WRITE (create or overwrite document) ── */
function fsSet(path, data, onOk, onErr){
  var url = _FS.base + "/" + path;
  fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(_fsEncode(data))
  })
  .then(function(r){
    if(!r.ok){
      return r.text().then(function(t){ throw new Error("HTTP " + r.status + ": " + t.substring(0,150)); });
    }
    return r.json();
  })
  .then(function(){ _FS.ok = true; if(onOk) onOk(); })
  .catch(function(e){ console.warn("[FS set] " + path, e); if(onErr) onErr(e); });
}

/* ── READ ONCE ── */
function fsGet(path, cb, onErr){
  var url = _FS.base + "/" + path;
  fetch(url)
  .then(function(r){
    if(r.status === 404){ return null; } // doc doesn't exist yet
    if(!r.ok){
      return r.text().then(function(t){ throw new Error("HTTP " + r.status + ": " + t.substring(0,150)); });
    }
    return r.json();
  })
  .then(function(doc){
    _FS.ok = true;
    if(doc === null){ if(cb) cb(null); return; }
    if(cb) cb(_fsDecode(doc));
  })
  .catch(function(e){
    console.warn("[FS get] " + path, e);
    _FS.ok = false;
    if(onErr) onErr(e); else if(cb) cb(null);
  });
}

/* ── REALTIME LISTENER (polling) ── */
function fsListen(path, cb, interval){
  fsUnlisten(path);
  var ms = (interval || 2) * 1000;
  fsGet(path, function(d){
    _FS.last[path] = JSON.stringify(d);
    cb(d);
  });
  _FS.poll[path] = setInterval(function(){
    fsGet(path, function(d){
      var str = JSON.stringify(d);
      if(str !== _FS.last[path]){
        _FS.last[path] = str;
        cb(d);
      }
    });
  }, ms);
}

function fsUnlisten(path){
  if(_FS.poll[path]){
    clearInterval(_FS.poll[path]);
    delete _FS.poll[path];
    delete _FS.last[path];
  }
}

/* ── CHECK CONNECTION STATUS ── */
function fsCheckStatus(cb){
  var url = _FS.base + "/maida_ping";
  fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(_fsEncode({ ts: Date.now() }))
  })
  .then(function(r){
    if(!r.ok) return r.text().then(function(t){ throw new Error(t); });
    return r.json();
  })
  .then(function(){ _FS.ok = true; cb(true); })
  .catch(function(e){ console.warn("[FS status]", e); _FS.ok = false; cb(false); });
}

/* ── COMPAT ALIASES (sama nama dengan kod sedia ada) ── */
function fbSet(path, data, onOk, onErr){ fsSet(path, data, onOk, onErr); }
function fbGet(path, cb, onErr){ fsGet(path, cb, onErr); }
function fbListen(path, cb, interval){ fsListen(path, cb, interval); }
function fbUnlisten(path){ fsUnlisten(path); }
function fbCheckStatus(cb){ fsCheckStatus(cb); }
function fbWhenReady(fn){ fn(); }
function fbOnReady(fn){ fn(); }
function fbListenAll(cb){ fsListen("maida/all", cb, 2); }
function fbSaveAll(data, onOk){
  fsSet("maida/all", data, onOk);
  try{ localStorage.setItem("_fb_bk", JSON.stringify(data)); }catch(e){}
}
function fbLoadAll(cb){
  fsGet("maida/all", function(d){
    if(d){ cb(d); return; }
    try{
      var b = localStorage.getItem("_fb_bk");
      cb(b ? JSON.parse(b) : null);
    }catch(e){ cb(null); }
  });
}

console.log("[Firestore] Module loaded ✓");
