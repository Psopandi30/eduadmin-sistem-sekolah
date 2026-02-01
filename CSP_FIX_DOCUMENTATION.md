# Perbaikan Content Security Policy (CSP) untuk Al-Qur'an

## 🔴 Masalah yang Ditemukan

### Error di Console Browser:
```
Connecting to 'https://api.alquran.cloud/...' violates the following Content Security Policy directive: "connect-src 'self' https://*.supabase.co wss://*.supabase.co". The action has been blocked.

Fetch API cannot load https://api.alquran.cloud/v1/surah/1/editions/quran-uthmani,id.indonesian,ar.alafasy. 
Refused to connect because it violates the document's Content Security Policy.
```

### Penyebab:
**Content Security Policy (CSP)** di file `public/_headers` hanya mengizinkan koneksi ke:
- `'self'` (domain sendiri)
- `https://*.supabase.co` (database Supabase)
- `wss://*.supabase.co` (WebSocket Supabase)

API Al-Qur'an eksternal **TIDAK** termasuk dalam whitelist, sehingga browser **memblokir** semua request ke:
- ❌ `https://api.alquran.cloud`
- ❌ `https://equran.id`
- ❌ `https://api.quran.com`
- ❌ `https://verses.quran.com`

---

## ✅ Solusi yang Diimplementasikan

### File: `public/_headers`

**SEBELUM:**
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' data:; img-src 'self' data: https:; media-src 'self' data: https:;
```

**SESUDAH:**
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.alquran.cloud https://equran.id https://api.quran.com https://verses.quran.com; font-src 'self' data:; img-src 'self' data: https:; media-src 'self' data: https:;
```

### Perubahan pada `connect-src`:
```diff
- connect-src 'self' https://*.supabase.co wss://*.supabase.co;
+ connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.alquran.cloud https://equran.id https://api.quran.com https://verses.quran.com;
```

### Domain yang Ditambahkan:
1. ✅ `https://api.alquran.cloud` - API AlQuran.cloud (Primary)
2. ✅ `https://equran.id` - API EQuran.id (Indonesian Server)
3. ✅ `https://api.quran.com` - API Quran.com (Global CDN)
4. ✅ `https://verses.quran.com` - Audio server Quran.com

---

## 📋 Penjelasan Content Security Policy (CSP)

### Apa itu CSP?
**Content Security Policy** adalah fitur keamanan browser yang membatasi dari mana aplikasi web boleh memuat resources (script, style, image, API, dll).

### Directive `connect-src`:
Mengontrol URL mana yang boleh di-fetch menggunakan:
- `fetch()`
- `XMLHttpRequest`
- `WebSocket`
- `EventSource`

### Kenapa Penting?
- 🛡️ **Keamanan**: Mencegah XSS (Cross-Site Scripting) attacks
- 🔒 **Privacy**: Mencegah data leak ke domain yang tidak dipercaya
- ✅ **Control**: Developer bisa kontrol penuh resource mana yang boleh diakses

---

## 🚀 Langkah Deployment

### 1. Build Ulang Aplikasi
```bash
npm run build
```

### 2. Deploy ke Cloudflare Pages
```bash
# Jika menggunakan Cloudflare Pages CLI
npx wrangler pages deploy dist

# Atau push ke Git (auto-deploy)
git add public/_headers
git commit -m "fix: Add Al-Quran API domains to CSP"
git push origin main
```

### 3. Verifikasi Deployment
1. Buka aplikasi di browser
2. Buka Developer Console (F12)
3. Klik menu "Al Quran"
4. Pilih surah
5. Cek console - seharusnya **TIDAK ADA** error CSP lagi
6. Surah berhasil dimuat! ✅

---

## 🧪 Testing

### Test 1: Localhost (Tidak Terpengaruh CSP)
```bash
npm run dev
```
- ✅ Al-Qur'an berfungsi normal (CSP tidak strict di development)

### Test 2: Production Build (CSP Aktif)
```bash
npm run build
npm run preview
```
- ✅ Al-Qur'an berfungsi normal dengan CSP yang sudah diperbaiki

### Test 3: Server Online
1. Deploy ke Cloudflare Pages
2. Buka domain production
3. Test Al-Qur'an
4. ✅ Seharusnya berfungsi tanpa error CSP

---

## 🔍 Cara Cek CSP di Browser

### Chrome/Edge DevTools:
1. Buka Developer Tools (F12)
2. Tab **Console**
3. Jika ada error CSP, akan muncul:
   ```
   Refused to connect to '<URL>' because it violates the following Content Security Policy directive: "connect-src ..."
   ```

### Firefox DevTools:
1. Buka Developer Tools (F12)
2. Tab **Console**
3. Filter: "CSP"

---

## ⚠️ Troubleshooting

### Jika Masih Error Setelah Deploy:

#### 1. Clear Cache Browser
```
Ctrl + Shift + Delete → Clear Cache
```

#### 2. Hard Reload
```
Ctrl + Shift + R (Chrome/Edge)
Ctrl + F5 (Firefox)
```

#### 3. Cek File `_headers` di Deployment
- Pastikan file `public/_headers` ter-copy ke folder `dist/_headers` saat build
- Cloudflare Pages otomatis membaca file `_headers` di root deployment

#### 4. Cek Response Headers
Di DevTools → Network → Pilih request → Headers → Response Headers
Cari: `Content-Security-Policy`
Pastikan berisi domain API Al-Qur'an

---

## 📊 Perbandingan Sebelum vs Sesudah

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| **Localhost** | ✅ Berfungsi | ✅ Berfungsi |
| **Server Online** | ❌ Error CSP | ✅ Berfungsi |
| **API AlQuran.cloud** | ❌ Blocked | ✅ Allowed |
| **API EQuran.id** | ❌ Blocked | ✅ Allowed |
| **API Quran.com** | ❌ Blocked | ✅ Allowed |
| **Audio Quran.com** | ❌ Blocked | ✅ Allowed |
| **Security** | ✅ Secure | ✅ Secure |

---

## 🎯 Kesimpulan

### Masalah Utama:
**Content Security Policy** memblokir koneksi ke API Al-Qur'an eksternal

### Solusi:
Menambahkan domain API Al-Qur'an ke whitelist CSP di `public/_headers`

### Hasil:
- ✅ Al-Qur'an berfungsi di localhost
- ✅ Al-Qur'an berfungsi di server online
- ✅ Keamanan tetap terjaga (hanya domain terpercaya yang diizinkan)
- ✅ Multiple fallback APIs tetap berfungsi

---

## 📝 Catatan Penting

1. **File `_headers` harus di folder `public/`** agar ter-copy ke `dist/` saat build
2. **Cloudflare Pages otomatis membaca `_headers`** di root deployment
3. **Setiap deploy ulang**, pastikan file `_headers` ikut ter-deploy
4. **CSP hanya berlaku di production**, development mode biasanya lebih permisif
5. **Jangan hapus domain Supabase** dari CSP (dibutuhkan untuk database)

---

## 🔗 Referensi

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/platform/headers/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

## ✅ Checklist Deployment

- [x] Update `public/_headers` dengan domain API Al-Qur'an
- [x] Build aplikasi (`npm run build`)
- [ ] Deploy ke Cloudflare Pages
- [ ] Test di browser production
- [ ] Verifikasi tidak ada error CSP di console
- [ ] Test semua 3 fallback APIs berfungsi
- [ ] Test caching berfungsi
- [ ] Test audio playback berfungsi

---

**Status**: ✅ **SIAP DEPLOY!**
