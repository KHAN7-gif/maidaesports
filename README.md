# 🎮 MAIDA ESPORTS — Tournament Management System

Sistem pengurusan turnamen PUBG Mobile esports secara live, dengan sync realtime antara semua peranti (desktop & mobile) melalui Cloud Firestore.

**Live URL:** https://khan7-gif.github.io/maidaesports/

---

## 📁 Struktur Fail

| Fail | Fungsi |
|---|---|
| `index.html` | **Halaman utama** — login, navigasi, pengurusan crew/user |
| `Standing_Point_v2.html` | **Master data** — senarai team, map, overall standing |
| `leaderboard_FINAL.html` | **Dashboard admin** + OBS Live Leaderboard (`#obs`) |
| `popup_kill_FINAL.html` | **OBS overlay** — popup ELIMINATED/WWCD, Final 4 |
| `HOME_DASHBOARD.html` | Navigasi crew |
| `public_results.html` | **Paparan awam** — live results, view-only |
| `firestore_sync.js` | Modul sync Cloud Firestore (REST API) — wajib untuk semua fail |

---

## 🔑 Login

| Username | Password | Akses |
|---|---|---|
| `admin` | `maida2026` | Penuh — urus crew, semua modul |
| `Mijj` / `Juju` / `Muiz` | *(kosong)* | Crew — pilih view modul |

Admin boleh tambah/edit/padam pengguna dari panel **Pengurusan Crew** dalam `index.html`. Senarai pengguna sync ke semua peranti melalui Firestore.

---

## 🔥 Firestore Setup (Firebase Console)

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → project **maida-esports**
2. **Build → Firestore Database → Create database**
3. Pilih **Start in test mode** (rules: `allow read, write: if true`)
4. Pilih lokasi (cth: `asia-southeast1`)
5. **Done** — tiada config API key diperlukan, `firestore_sync.js` guna `projectId` sahaja

### Data Documents (Firestore)
| Path | Sumber | Kandungan |
|---|---|---|
| `maida/spData` | Standing_Point_v2.html | teams (nama), maps, title |
| `maida/liveData` | leaderboard_FINAL.html | pts, elims, alive, stage |
| `maida/users` | index.html | senarai admin & crew |

> **Nota:** Logo/banner team **TIDAK** disync (terlalu besar untuk satu dokumen). Setiap peranti kekalkan logo tempatan; nama team, ranking, dan skor sahaja yang disync merentas peranti.

---

## 📺 OBS Setup

1. OBS Studio → **Sources** → **+** → **Browser**
2. URL: `https://khan7-gif.github.io/maidaesports/leaderboard_FINAL.html#obs`
3. Width: `500` · Height: `900`
4. Untuk Popup Kill: `https://khan7-gif.github.io/maidaesports/popup_kill_FINAL.html` (Width `1920` × Height `1080`)
5. Untuk Overall Standing (landscape): `https://khan7-gif.github.io/maidaesports/Standing_Point_v2.html#medsos`

---

## 🔄 Aliran Data (Cross-Device)

```
Desktop: Standing_Point_v2.html (tambah/edit team)
        │  fsSet → maida/spData (Firestore)
        ▼
Mobile/Desktop lain: leaderboard_FINAL.html, public_results.html
        │  fsListen('maida/spData') → terima team list (poll 2-3s)
        ▼
leaderboard_FINAL.html (input PTS/ELIMS/P1-P4)
        │  fsSet → maida/liveData (Firestore)
        ▼
   ┌─────────────┬──────────────┬───────────────┐
   ▼             ▼              ▼               ▼
popup_kill   OBS Leaderboard   public_results  index.html (status)
(fsListen)   (fsListen)        (fsListen)      (fsListen)
```

Semua peranti sync melalui Firestore (polling setiap 2-5 saat), dengan **localStorage** sebagai cache/fallback tempatan.

---

## 🐛 Debug (Standing Point)

Buka Console (F12) dalam `Standing_Point_v2.html`:
- `spDebug()` — banding data tempatan vs Firestore
- `spForceSync()` — push data tempatan ke Firestore
- `spForceLoad()` — tarik data dari Firestore ke tempatan

Badge di sudut kanan atas menunjukkan status sambungan Firestore.

---

## 🛠 Storage Keys (localStorage — cache tempatan)

| Key | Guna |
|---|---|
| `hswp_2026_pro` | Standing Point state (cache) |
| `maida_v5` | Leaderboard live match (cache) |
| `maida_live_v1` | Broadcast channel realtime (popup events) |
| `maidaAuth` | Sesi login (8 jam) |
| `maidaUsers` | Senarai pengguna (cache) |

---

## ⚙️ Tukar Password Admin

Dalam `index.html`, cari fungsi `loadUsers()` dan tukar:
```javascript
{user:"admin", pass:"maida2026", role:"admin", color:"#ffb400"}
```

---

*MAIDA ESPORTS — PUBG Mobile Tournament System*
