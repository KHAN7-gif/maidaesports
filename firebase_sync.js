/* ═══════════════════════════════════════════════════════════════
   MAIDA ESPORTS — FIREBASE SYNC MODULE
   Sertakan dalam semua HTML: <script src="firebase_sync.js"></script>
═══════════════════════════════════════════════════════════════ */

/* ══ FIREBASE CONFIG — MAIDA ESPORTS ══ */
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDLCgbgqki3CwFPRflfQanShuwvwLZdhuk",
  authDomain:        "maida-esports.firebaseapp.com",
  databaseURL:       "https://maida-esports-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "maida-esports",
  storageBucket:     "maida-esports.firebasestorage.app",
  messagingSenderId: "134294506836",
  appId:             "1:134294506836:web:adeff90715e4e9b4150cc1"
};

/* ══ STORAGE KEYS ══ */
var FB_PATHS = {
  users:    "maida/users",
  crew:     "maida/crew",
  liveData: "maida/liveData",
  spData:   "maida/spData",
  obsLinks: "maida/obsLinks",
  title:    "maida/title",
  colors:   "maida/colors",
  timer:    "maida/timer"
};

/* ══ STATE ══ */
var fbApp    = null;
var fbDb     = null;
var fbReady  = false;
var fbListeners = {};
var fbOnReady = [];

/* ══ INIT FIREBASE ══ */
function fbInit() {
  // Load Firebase SDK dynamically
  var sdkScript = document.createElement('script');
  sdkScript.type = 'module';
  sdkScript.textContent = [
    'import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";',
    'import { getDatabase, ref, set, get, onValue, off } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";',
    '',
    'var cfg = ' + JSON.stringify(FIREBASE_CONFIG) + ';',
    'window._fbApp = initializeApp(cfg);',
    'window._fbDb  = getDatabase(window._fbApp);',
    'window._fbRef = ref;',
    'window._fbSet = set;',
    'window._fbGet = get;',
    'window._fbOnValue = onValue;',
    'window._fbOff = off;',
    'window._fbReady = true;',
    // Notify all waiting callbacks
    'if(window._fbOnReadyCbs){window._fbOnReadyCbs.forEach(function(fn){fn();});}',
    'console.log("[Firebase] Connected to:", cfg.databaseURL);'
  ].join('\n');
  document.head.appendChild(sdkScript);
}

/* ══ QUEUE CALLBACK WHEN READY ══ */
window._fbOnReadyCbs = window._fbOnReadyCbs || [];
function fbWhenReady(fn) {
  if (window._fbReady) { fn(); }
  else { window._fbOnReadyCbs.push(fn); }
}

/* ══ WRITE TO FIREBASE ══ */
function fbSet(path, data, onSuccess, onError) {
  fbWhenReady(function() {
    try {
      var r = window._fbRef(window._fbDb, path);
      window._fbSet(r, data)
        .then(function() { if (onSuccess) onSuccess(); })
        .catch(function(e) { console.warn('[Firebase] Set error:', e); if (onError) onError(e); });
    } catch(e) { console.warn('[Firebase] fbSet exception:', e); if (onError) onError(e); }
  });
}

/* ══ READ ONCE FROM FIREBASE ══ */
function fbGet(path, onData, onError) {
  fbWhenReady(function() {
    try {
      var r = window._fbRef(window._fbDb, path);
      window._fbGet(r)
        .then(function(snapshot) {
          if (onData) onData(snapshot.exists() ? snapshot.val() : null);
        })
        .catch(function(e) { console.warn('[Firebase] Get error:', e); if (onError) onError(e); });
    } catch(e) { console.warn('[Firebase] fbGet exception:', e); if (onError) onError(e); }
  });
}

/* ══ REALTIME LISTENER ══ */
function fbListen(path, callback) {
  fbWhenReady(function() {
    try {
      var r = window._fbRef(window._fbDb, path);
      var unsub = window._fbOnValue(r, function(snapshot) {
        callback(snapshot.exists() ? snapshot.val() : null);
      });
      fbListeners[path] = {ref: r, unsub: unsub};
    } catch(e) { console.warn('[Firebase] Listen error:', e); }
  });
}

/* ══ REMOVE LISTENER ══ */
function fbUnlisten(path) {
  if (fbListeners[path]) {
    try { window._fbOff(fbListeners[path].ref); }
    catch(e) {}
    delete fbListeners[path];
  }
}

/* ══ SAVE ALL DATA ══ */
function fbSaveAll(data, onSuccess) {
  fbSet("maida", data, onSuccess, function(e) {
    console.warn('[Firebase] SaveAll failed, using localStorage fallback');
    // Fallback to localStorage
    try { localStorage.setItem('maida_firebase_backup', JSON.stringify(data)); }
    catch(ex) {}
  });
  // Also save to localStorage as backup
  try { localStorage.setItem('maida_firebase_backup', JSON.stringify(data)); }
  catch(e) {}
}

/* ══ LOAD ALL DATA ══ */
function fbLoadAll(onData) {
  fbGet("maida", function(data) {
    if (data) {
      onData(data);
    } else {
      // Try localStorage backup
      try {
        var backup = localStorage.getItem('maida_firebase_backup');
        if (backup) onData(JSON.parse(backup));
        else onData(null);
      } catch(e) { onData(null); }
    }
  });
}

/* ══ LISTEN ALL (realtime sync) ══ */
function fbListenAll(callback) {
  fbListen("maida", callback);
}

/* ══ CONNECTION STATUS ══ */
function fbCheckStatus(onStatus) {
  fbWhenReady(function() {
    try {
      var connRef = window._fbRef(window._fbDb, '.info/connected');
      window._fbOnValue(connRef, function(snap) {
        onStatus(snap.val() === true);
      });
    } catch(e) { onStatus(false); }
  });
}

/* ══ AUTO INIT ══ */
if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY") {
  fbInit();
} else {
  console.warn('[Firebase] Config belum diisi. Sila update FIREBASE_CONFIG dalam firebase_sync.js');
}
