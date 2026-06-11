/* ═══════════════════════════════════════════════════════════════
   MAIDA ESPORTS — FIREBASE SYNC MODULE v2
   Sertakan dalam semua HTML: <script src="firebase_sync.js"></script>
   
   Data yang disync ke Firebase Realtime Database:
   - maida/users       → senarai pengguna (admin/crew)
   - maida/liveData    → data match live (pts/elims/alive)
   - maida/spData      → standing point data
   - maida/obsLinks    → OBS browser source links
   - maida/title       → nama tournament
═══════════════════════════════════════════════════════════════ */

/* ══ FIREBASE CONFIG ══ */
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDLCgbgqki3CwFPRflfQanShuwvwLZdhuk",
  authDomain:        "maida-esports.firebaseapp.com",
  databaseURL:       "https://maida-esports-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "maida-esports",
  storageBucket:     "maida-esports.firebasestorage.app",
  messagingSenderId: "134294506836",
  appId:             "1:134294506836:web:adeff90715e4e9b4150cc1"
};

/* ══ INTERNAL STATE ══ */
window._fb = {
  ready:     false,
  db:        null,
  queue:     [],
  listeners: {},
  callbacks: []
};

/* ══ LOAD FIREBASE SDK via CDN (compat version — works without bundler) ══ */
(function loadFirebase() {
  // Use Firebase CDN compat build — works directly in browser without import/export
  var APP_CDN  = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
  var DB_CDN   = "https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js";

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function() { console.error('[Firebase] Failed to load:', src); };
    document.head.appendChild(s);
  }

  loadScript(APP_CDN, function() {
    loadScript(DB_CDN, function() {
      try {
        var app = firebase.initializeApp(FIREBASE_CONFIG);
        window._fb.db = firebase.database();
        window._fb.ready = true;

        // Process queued calls
        window._fb.queue.forEach(function(fn) { try { fn(); } catch(e) {} });
        window._fb.queue = [];

        // Notify ready callbacks
        window._fb.callbacks.forEach(function(fn) { try { fn(); } catch(e) {} });

        console.log('[Firebase] ✅ Connected:', FIREBASE_CONFIG.databaseURL);
      } catch(e) {
        console.error('[Firebase] Init failed:', e);
      }
    });
  });
})();

/* ══ QUEUE: run when ready ══ */
function fbWhenReady(fn) {
  if (window._fb.ready) { try { fn(); } catch(e) { console.warn('[FB]',e); } }
  else { window._fb.queue.push(fn); }
}

/* ══ ON READY CALLBACK ══ */
function fbOnReady(fn) {
  if (window._fb.ready) { fn(); }
  else { window._fb.callbacks.push(fn); }
}

/* ══ WRITE DATA ══ */
function fbSet(path, data, onSuccess, onError) {
  fbWhenReady(function() {
    window._fb.db.ref(path).set(data)
      .then(function() { if (onSuccess) onSuccess(); })
      .catch(function(e) {
        console.warn('[Firebase] Write error at', path, e);
        if (onError) onError(e);
      });
  });
}

/* ══ READ ONCE ══ */
function fbGet(path, onData, onError) {
  fbWhenReady(function() {
    window._fb.db.ref(path).get()
      .then(function(snap) {
        if (onData) onData(snap.exists() ? snap.val() : null);
      })
      .catch(function(e) {
        console.warn('[Firebase] Read error at', path, e);
        if (onError) onError(e);
      });
  });
}

/* ══ REALTIME LISTENER ══ */
function fbListen(path, callback) {
  // Remove existing listener first
  fbUnlisten(path);
  fbWhenReady(function() {
    var ref = window._fb.db.ref(path);
    ref.on('value', function(snap) {
      callback(snap.exists() ? snap.val() : null);
    }, function(e) {
      console.warn('[Firebase] Listener error at', path, e);
    });
    window._fb.listeners[path] = ref;
  });
}

/* ══ REMOVE LISTENER ══ */
function fbUnlisten(path) {
  if (window._fb.listeners[path]) {
    try { window._fb.listeners[path].off(); }
    catch(e) {}
    delete window._fb.listeners[path];
  }
}

/* ══ LISTEN ALL (maida root) ══ */
function fbListenAll(callback) {
  fbListen("maida", callback);
}

/* ══ SAVE ALL DATA ══ */
function fbSaveAll(data, onSuccess) {
  // Save to Firebase
  fbSet("maida", data, onSuccess, function() {
    console.warn('[Firebase] Save failed — using localStorage backup');
  });
  // Always backup to localStorage too
  try { localStorage.setItem('maida_fb_backup', JSON.stringify(data)); } catch(e) {}
}

/* ══ LOAD ALL DATA ══ */
function fbLoadAll(onData) {
  fbGet("maida", function(data) {
    if (data) {
      onData(data);
    } else {
      // Fallback to localStorage backup
      try {
        var backup = localStorage.getItem('maida_fb_backup');
        onData(backup ? JSON.parse(backup) : null);
      } catch(e) { onData(null); }
    }
  });
}

/* ══ CONNECTION STATUS ══ */
function fbCheckStatus(onStatus) {
  fbWhenReady(function() {
    window._fb.db.ref('.info/connected').on('value', function(snap) {
      onStatus(snap.val() === true);
    });
  });
}

/* ══ PUSH TO LIST (auto-key) ══ */
function fbPush(path, data, onSuccess, onError) {
  fbWhenReady(function() {
    window._fb.db.ref(path).push(data)
      .then(function(ref) { if (onSuccess) onSuccess(ref.key); })
      .catch(function(e) { if (onError) onError(e); });
  });
}

/* ══ UPDATE (partial) ══ */
function fbUpdate(path, updates, onSuccess, onError) {
  fbWhenReady(function() {
    window._fb.db.ref(path).update(updates)
      .then(function() { if (onSuccess) onSuccess(); })
      .catch(function(e) { if (onError) onError(e); });
  });
}

console.log('[Firebase] Module loaded — waiting for SDK...');
