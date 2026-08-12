# Security Audit & Fixes

Dokumentasi hasil audit keamanan dan perbaikan yang telah diterapkan pada Buildfolio.

## Ringkasan Audit (Aug 2026)

Audit mencakup: autentikasi (JWT / NextAuth), otorisasi (IDOR / ownership check), injection (XSS, SQL, header email), open redirect, pemaparan data sensitif, rate limiting, konfigurasi cookies, dan dependensi.

---

## Temuan & Perbaikan

### 1. IDOR — Delete komentar & bookmark tanpa cek kepemilikan (Critical)

**Masalah:** Endpoint `DELETE /api/comments/:id` dan `DELETE /api/bookmarks/:id` mengeksekusi proses delete terlebih dahulu, baru melakukan cek kepemilikan. Pengguna login mana pun bisa menghapus komentar/bookmark milik orang lain (mendapat respons 403 tapi data sudah terhapus).

**Lokasi:** `src/app/api/comments/[id]/route.ts`, `src/app/api/bookmarks/[id]/route.ts`, `src/lib/services/commentService.ts`, `src/lib/services/bookmarkService.ts`

**Perbaikan:**
- Tambahkan `getCommentById` dan `getBookmarkById` di service layer untuk mengambil record beserta `user_id` sebelum delete.
- Route kini melakukan ownership check (404 jika tidak ada, 403 jika bukan pemilik) sebelum memanggil delete.
- Delete hanya dieksekusi setelah otorisasi lolos.

### 2. Open redirect via parameter `?redirect=` (Medium)

**Masalah:** `LoginClient` langsung memakai nilai `redirect` dari query string untuk `router.push()`, sehingga attacker bisa mengarahkan pengguna ke situs eksternal setelah login.

**Lokasi:** `src/app/login/LoginClient.tsx`

**Perbaikan:**
- Tambahkan `getSafeRedirect()` yang hanya mengizinkan path internal (diawali `/`, bukan `//` atau `/\`).
- Nilai lain otomatis diarahkan ke `/`.

### 3. Header injection & spam pada form kontak (Medium)

**Masalah:** Endpoint `POST /api/contact` memasukkan `name`, `email`, dan `message` mentah dari pengguna ke field `from`/`subject` email (berisiko header injection / phishing), tidak ada validasi panjang, dan tidak ada rate limit (bisa disalahgunakan untuk spam email).

**Lokasi:** `src/app/api/contact/route.ts`

**Perbaikan:**
- Tambahkan rate limit (3 pesan / 15 menit / IP).
- Validasi format email dan batas panjang input (name 100, email 254, message 5000 karakter).
- `from` tidak lagi memakai input pengguna (memakai `noreply@buildfolio.dev`), input di-strip dari karakter kontrol line-break, dan konten HTML di-escape.

### 4. Open upload endpoint tanpa autentikasi (High)

**Masalah:** Router Uploadthing (`imageUploader`) tidak memverifikasi pengguna — siapa pun bisa mengunggah file via `/api/uploadthing` tanpa login.

**Lokasi:** `src/lib/uploadthing.ts`

**Perbaikan:**
- Middleware kini mewajibkan JWT (dari cookie `buildfolio_token` atau header `Authorization: Bearer`).
- Mengembalikan `userId` sebagai metadata upload sebagai jejak audit.

### 5. JWT terpapar ke localStorage & fallback Bearer (High)

**Masalah:** Token JWT disimpan di Redux + localStorage pada login/register/Google-OAuth, dan `realApiClient` menambahkan header `Authorization: Bearer` dari token tersebut. Token yang tersimpan di localStorage rentan dicuri via XSS sehingga menghilangkan manfaat cookie `httpOnly`.

**Lokasi:** `src/app/login/LoginClient.tsx`, `src/app/register/RegisterClient.tsx`, `src/app/auth/google-callback/page.tsx`, `src/store/redux/authSlice.ts`, `src/lib/api/realApiClient.ts`, `src/app/api/auth/exchange/route.ts`

**Perbaikan:**
- Token tidak lagi disimpan ke Redux/localStorage pada alur login, register, dan Google OAuth.
- Interceptor Bearer pada axios dihapus; autentikasi sepenuhnya via cookie `httpOnly` (`withCredentials: true`).
- `authSlice` men-strip field `token` bila muncul pada payload.
- Response `POST /api/auth/exchange` tidak lagi mengirim token ke client (hanya user info).

---

## Temuan yang Belum Diperbaiki (Rekomendasi Selanjutnya)

| Severity | Temuan | Lokasi | Catatan |
| -------- | ------ | ------ | ------- |
| High | Update `next` ke versi aman (16.3.x) | `package.json` | Beberapa advisori (middleware bypass, DoS, SSRF) sudah di-patch di versi terbaru |
| High | Update `uploadthing` (breaking) / `effect`, `nanoid`, `sharp` | `package.json` | `npm audit` menampilkan 1 critical, 7 high, 1 moderate |
| Medium | `likes` proyek bisa di-set manual via PATCH | `src/lib/services/projectService.ts` | Pemilik proyek dapat menambah likes sendiri; sebaiknya dihapus dari whitelist update |
| Medium | Email verification tidak di-enforce saat login | `src/lib/services/userService.ts` | `loginUserService` tidak mengecek `isVerified` |
| Medium | Enumeration email via `GET /api/users` & `409` register | `src/app/api/users/route.ts`, `users/[id]/route.ts` | Public endpoint mengekspos daftar email |
| Medium | Rate limit in-memory per instance serverless | `src/lib/rateLimit.ts` | Pada Vercel tiap lambda punya Map sendiri; bypass dengan banyak instance; `x-forwarded-for` dapat di-spoof |
| Medium | Security headers belum diset (CSP, HSTS, X-Frame-Options) | `next.config.ts` | Tambahkan `headers()` di next.config |
| Low | `dangerouslyAllowSVG: true` + avatar seed dari input user | `next.config.ts` | Risiko rendah karena dicebear men-sanitasi output |
| Low | Tidak ada batas panjang `title`/`description`/`content` di server | berbagai service | Risiko bloat DB |
| Low | `middleware.ts` hanya cek struktur JWT (3 bagian), bukan tanda tangan | `src/middleware.ts` | API tetap memverifikasi penuh; murni defense-in-depth |

---

## Praktik Baik yang Sudah Berjalan

- Password di-hash dengan `bcrypt` (10 salt rounds) dengan kebijakan kekuatan password.
- Cookie token `httpOnly` + `Secure` (production) + `SameSite=Lax`.
- Ownership check pada edit/delete proyek, profil, dan password.
- Rate limiting pada login (10x/15m) dan register (5x/jam).
- Error message DB tidak bocor ke client di production (`dbErrorMessage`).
- `.env*` dan `src/generated/prisma` berada di `.gitignore`.
- Respons error yang identik untuk email/password salah pada login (anti-enumeration via login).