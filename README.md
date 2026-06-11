# MAIDA ESPORTS — Tournament Management System
## PUBG Mobile Esports Tournament

Live tournament dashboard system untuk PUBG Mobile esports tournament.

---

## Struktur Fail

```
maidaesports/
  index.html              <- Halaman utama (login + navigasi)
  Standing_Point_v2.html  <- Master data (team, map, overall)
  leaderboard_FINAL.html  <- Dashboard admin + OBS leaderboard
  popup_kill_FINAL.html   <- Auto popup kill/eliminated/WWCD
  HOME_DASHBOARD.html     <- Navigasi crew (8 modul)
```

---

## Cara Guna

### 1. GitHub Pages
- Buka: `https://khan7-gif.github.io/maidaesports/`
- Login sebagai **Admin** atau pilih **Crew**

### 2. Login
| Peranan | Cara Masuk | Akses |
|---------|-----------|-------|
| **Admin** | Password: `maida2026` | Penuh |
| **Crew** | Klik nama (Mijj/Juju/Muiz) | Terhad |

### 3. Aliran Data
```
Standing_Point_v2.html  (Master - tambah team di sini)
        |
        v  hswp_2026_pro (localStorage)
        |
leaderboard_FINAL.html  (Input PTS/ELIMS/P1-P4)
        |
        v  maida_live_v1 (broadcast realtime)
        |
   +----+----+
   |         |
popup_kill   OBS Window
(auto popup) (auto update)
```

### 4. OBS Setup
1. OBS Studio -> Sources -> + -> Browser
2. Tick **Local File** (atau guna GitHub Pages URL)
3. URL: `https://khan7-gif.github.io/maidaesports/leaderboard_FINAL.html#obs`
4. Width: `500` | Height: `900`
5. Buka admin dahulu sebelum OBS

### 5. Password Admin
Tukar dalam `index.html`:
```javascript
var ADMIN_PASS = "maida2026";
```

---

## localStorage Keys
| Key | Guna |
|-----|------|
| `hswp_2026_pro` | Team list master (Standing Point) |
| `maida_v5` | Live match data (pts/elims/alive) |
| `maida_live_v1` | Realtime broadcast channel |
| `maidaAuth` | Session login (8 jam) |
| `maidaCrewList` | Senarai crew |
| `maidaObsLinks` | OBS link settings |

---

## Tech Stack
- Pure HTML/CSS/JavaScript
- localStorage untuk data sharing
- Tiada server diperlukan
- Sesuai untuk GitHub Pages

---

*MAIDA ESPORTS Tournament System - PUBG Mobile*
