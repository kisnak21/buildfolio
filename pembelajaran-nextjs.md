# Buildfolio (Next.js 16) — Catatan Pembelajaran

> Proyek ini adalah tugas bootcamp fullstack dari [harisenin.com](https://harisenin.com).
> Dokumen ini merangkum apa yang aku pelajari dari versi **monorepo full-stack Next.js 16 App Router** (repo ini), sebagai lanjutan dari [pembelajaran.md](./pembelajaran.md) yang mencatat versi React (Vite) + Express. Bagian terakhir berisi perbandingan fitur yang ditambahkan, dihapus, dan berubah implementasinya.

---

## Fitur yang Dibuat

### Publik (tanpa login)
- Homepage: Featured Projects, Browse by Category, Trending Technologies, Community Favorites
- Halaman daftar proyek dengan pencarian, filter kategori **dan teknologi**, sort (terbaru/terlama/paling banyak likes/abjad), serta pagination (6 proyek/halaman)
- Halaman detail proyek dengan like, bookmark, dan komentar — **server-rendered** dengan dynamic metadata
- Halaman profil user publik (`/u/[author]`) dengan stats + grid proyek — server-rendered
- SEO: `sitemap.xml`, `robots.txt`, Open Graph image yang di-generate, dynamic metadata per halaman
- Halaman FAQ, Contact (kirim pesan ke inbox pribadi via Resend), Privacy Policy, Terms of Service
- Loading skeleton, halaman error global (`error.tsx`), dan 404 page

### Auth
- Register (nama, email, password), login, logout
- JWT disimpan di **httpOnly cookie** (bukan localStorage) — aman dari XSS
- Email verification via Resend + endpoint resend-verification
- **Forgot / reset password** via link email (token dengan expiry)
- **Google OAuth** via NextAuth v4 (one-click sign-in, auto-create user)
- Ganti password dari halaman Settings
- Rate limiting di semua endpoint auth & mutasi (Upstash Redis)
- CSRF check (origin) + validasi URL scheme

### Khusus login (Dashboard)
- Dashboard: stats (total proyek, likes diterima, bookmarks) + tabel proyek dengan Edit/Delete
- Create/Edit Project dengan **thumbnail upload via Uploadthing** (preview + replace)
- Delete Project dengan confirmation dialog
- Halaman Bookmarks dan **Liked Projects** (baru, dengan toggle like)
- Komentar (post & delete) di halaman detail proyek
- Settings: update nama & bio, change password

---

## Tech Stack

| Layer            | Teknologi                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript             |
| Styling          | Tailwind CSS v4 + custom neo-brutalism components                      |
| Database         | PostgreSQL serverless (Neon)                                           |
| ORM              | Prisma ORM v7 + `@prisma/adapter-pg` (pg Pool)                         |
| Authentication   | `bcrypt` + JWT (`jsonwebtoken` untuk sign, `jose` untuk edge verify) + NextAuth v4 (Google OAuth) |
| Email            | Resend                                                                |
| File Upload      | Uploadthing v7                                                         |
| Rate Limiting    | `@upstash/ratelimit` + `@upstash/redis` (fallback in-memory)           |
| State Management | Redux Toolkit + React Redux (6 slices)                                 |
| API Client       | Native `fetch` (bukan Axios)                                           |
| Icons            | @heroicons/react                                                       |

Struktur monorepo (satu codebase, frontend + backend dalam satu proses):

```
src/
├── app/            # Halaman (App Router) + api/ route handlers
├── components/     # auth, layout, home, dashboard, ui
├── lib/            # api (client), services (Prisma), middleware, data, email, rateLimit
├── middleware.ts   # Proteksi route + verifikasi JWT di edge
├── generated/prisma/  # Prisma Client yang di-generate
└── store/redux/    # store, provider, hooks, slices
```

---

## Authentication

- **Register**: password di-hash `bcrypt` (salt rounds 10), user dibuat, token verifikasi dikirim via Resend.
- **Login**: `bcrypt.compare` → JWT `{ id, email, name }` (`expiresIn: '7d'`) → disimpan di **httpOnly cookie** `buildfolio_token`. Cookie tidak bisa dibaca JavaScript → kebal XSS, tetap survive page refresh.
- **Verifikasi email**: endpoint `/api/users/verify-email?token=...` meng-set `is_verified = true`; user yang belum verified ditolak login (403). Ada endpoint `resend-verification` kalau email pertama terlewat.
- **Forgot/reset password**: token dengan expiry disimpan di DB (`reset_password_token` + `reset_password_expires`), dikirim via email, dipakai sekali di halaman reset.
- **Proteksi route**: `src/middleware.ts` melindungi `/dashboard`, `/bookmarks`, `/settings`, `/liked` dengan **verifikasi JWT penuh di edge** (`jose`/`jwtVerify`) — bukan sekadar cek cookie ada. Halaman guest-only (`/login`, `/register`) redirect ke home jika sudah login.
- **Google OAuth**: NextAuth v4 di `/api/auth/[...nextauth]`, lalu endpoint `exchange` mengubah session NextAuth menjadi JWT app di httpOnly cookie.
- **Dua implementasi verifikasi JWT**: `jsonwebtoken` di Node runtime (API routes) dan `jose` di edge runtime (middleware) — keduanya memakai secret yang sama.
- **Rate limiting per endpoint** (Upstash Redis, fallback in-memory): login 10/15m, register 5/jam, forgot-password 3/15m, reset-password 5/15m, resend-verification 3/15m, create project 10/jam, update/delete project 30/15m, bookmarks 20/menit, komentar 15/menit, contact 3/15m.

---

## Database

- PostgreSQL serverless di **Neon**, diakses lewat `pg` Pool + `@prisma/adapter-pg`.
- Prisma v7 dengan 8 model: `User`, `Category`, `Technology`, `Project`, `ProjectLike`, `ProjectTechnology` (junction), `Bookmark`, `Comment` — di-map ke tabel snake_case.
- **`project_likes` (baru)**: tabel relasi many-to-many dengan `@@unique([userId, projectId])` untuk like yang race-free — toggle like memakai `increment` atomik + unique constraint, tidak ada like ganda.
- **Indexing**: index di kolom yang sering difilter/di-join (user, category, project, comment) lewat migration `006_add_indexes.sql`.
- **Batch resolution teknologi**: mengambil banyak proyek sekaligus dengan teknologi di-resolve dalam batch, bukan N+1 query.
- **Live technology stats**: jumlah proyek per teknologi dihitung dari relasi, bukan field statis.
- Migrasi SQL disimpan lokal (`/migrations`, gitignored) dan diterapkan via `npx prisma db push` atau Neon SQL editor; Prisma Client di-generate ke `src/generated/prisma` (`postinstall`).
- Seed proyek dengan thumbnail **self-hosted** (gambar lokal, bukan URL eksternal).

---

## API

Semua API adalah **Next.js Route Handlers** di `src/app/api/**/route.ts` — tidak ada server terpisah:

```
GET/POST     /api/users                  PATCH/DELETE /api/users/:id
POST         /api/users/login            POST   /api/users/logout
GET          /api/users/verify-email     POST   /api/users/resend-verification
POST         /api/users/forgot-password  POST   /api/users/reset-password
PATCH        /api/users/:id/password
GET/POST     /api/projects               GET/PATCH/DELETE /api/projects/:id
POST         /api/projects/:id/like      GET    /api/projects/liked
GET/POST     /api/bookmarks              DELETE /api/bookmarks/:id
GET/POST     /api/comments               DELETE /api/comments/:id
POST         /api/contact
GET          /api/auth/[...nextauth]     POST   /api/auth/exchange
```

- Pola **routes → services**: route handler tipis, logika DB di `src/lib/services/` (Prisma).
- **Unified error mapping** (`apiErrors.ts`): kode error Prisma di-map ke response HTTP yang konsisten.
- Response shape dinormalisasi `{ success, data }` / `{ success, message }`.
- **Cache headers** di endpoint GET publik (`public, s-maxage=60, stale-while-revalidate=120`) supaya bisa di-cache CDN.
- **Tanpa CORS**: frontend dan API satu origin; mutasi dilindungi **Origin CSRF check** (`assertSameOrigin`).
- **Ownership enforcement**: update/delete proyek dan profil hanya boleh pemiliknya.

---

## Upload / File

- **Uploadthing v7** menggantikan Multer disk storage — file disimpan di object storage serverless, bukan filesystem lokal (yang ephemeral dan tidak cocok untuk deploy serverless).
- `UploadButton` dari `@uploadthing/react` di ProjectForm dengan preview thumbnail dan tombol "Replace thumbnail".
- Konfigurasi di `src/lib/uploadthing.ts` (server) + `src/lib/uploadthing-client.ts` (client).
- Endpoint handler `/api/uploadthing` + CSP subdomain untuk `ingest.uploadthing.com` / `utfs.io` (sempat error FetchError sampai subdomain ditambahkan).
- Gambar seed proyek di-self-host supaya tidak bergantung pada URL eksternal.

---

## State Management

Redux Toolkit + React Redux, **6 slice** di `src/store/redux/`:

| Slice       | Isi                                                                  |
| ----------- | -------------------------------------------------------------------- |
| `auth`      | currentUser, login/logout/updateProfile — persist user (bukan token) ke localStorage |
| `projects`  | daftar proyek, detail, CRUD — `createAsyncThunk`                     |
| `bookmarks` | daftar bookmark user                                                |
| `comments`  | komentar per proyek                                                  |
| `likes`     | status like + toggle, memakai selector yang di-memoize               |
| `toast`     | notifikasi global (auto-dismiss 5s + fade-out)                       |

- Async state (`pending/fulfilled/rejected`) via `createAsyncThunk`, UI menampilkan loading skeleton dan error state.
- **Perubahan penting**: hanya *user object* yang dipersist ke localStorage (`buildfolio_user`) untuk inisialisasi cepat — **token tidak pernah** disimpan di localStorage (keamanan XSS), session sepenuhnya di httpOnly cookie.

---

## Hal Tersulit

1. **Migrasi database dari raw SQL ke Prisma** — mengganti query `LEFT JOIN` 5 tabel + `json_agg` + `GROUP BY` dengan relasi Prisma, sambil menambahkan tabel `project_likes` dan memastikan data lama tetap kompatibel (termasuk mengganti thumbnail seed ke gambar self-hosted).
2. **Auth di dua runtime berbeda** — JWT harus diverifikasi di Node runtime (API routes, `jsonwebtoken`) DAN di edge runtime (middleware, `jose`). Memahami mana yang jalan di mana dan menjaga secret serta payload tetap konsisten butuh waktu.
3. **Like yang race-free** — mencegah like ganda dan hitungan likes yang salah saat dua request datang bersamaan; solusinya unique constraint `[userId, projectId]` + `increment` atomik.
4. **Integrasi NextAuth dengan JWT custom** — session NextAuth harus di-exchange menjadi JWT app di httpOnly cookie, dan sinkron dengan user record lokal (termasuk user yang register dengan Google).
5. **Bug-bug nyata pasca-refactor** — project creation 400 karena placeholder URL `#`, category name ter-drop di API client, FetchError Uploadthing karena CSP, sampai response shape yang tidak konsisten — semuanya ketahuan lewat debugging manual.
6. **Hardening keamanan** — IDOR (akses/edit data milik orang lain), open redirect, email header injection, upload tanpa auth, JWT yang terekspos — diperbaiki sekaligus dengan Origin CSRF check, URL scheme validation, dan rate limiting di semua mutasi.
7. **Performa & SEO** — memindahkan halaman detail/profil dari client-side ke server-render dengan dynamic metadata, sitemap/robots/OG image, cache headers, dan menghentikan Axios demi native fetch.

---

## Hal yang Aku Pelajari

- **Next.js 16 App Router yang sebenarnya** — file convention (`page.tsx`, `route.ts`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`), route handlers, dynamic metadata, middleware, dan fakta bahwa versi ini punya breaking changes yang harus dibaca dari dokumentasi resmi.
- **Prisma ORM v7** — driver adapter (`@prisma/adapter-pg`), schema-first, relasi, unique constraint untuk integritas data, error mapping.
- **Keamanan session modern** — kenapa httpOnly cookie mengalahkan localStorage untuk token (XSS), CSRF origin check, rate limiting terdistribusi (Upstash Redis) vs in-memory, dan OAuth (NextAuth) sebagai alternatif credential login.
- **Edge vs Node runtime** — middleware Next.js berjalan di edge, sehingga verifikasi JWT pakai `jose` yang mendukung edge, bukan `jsonwebtoken`.
- **Serverless file upload** — pola Uploadthing: presigned upload langsung dari browser ke CDN, tidak lewat server app (beda dengan Multer yang melewati server dan menyimpan di disk).
- **SEO & performa SSR** — dynamic metadata, sitemap/robots/OG image generation, cache headers (CDN), dan dampak server-render terhadap skor SEO dibanding SPA murni.
- **Email transactional** — Resend API (satu REST call, tanpa SMTP config seperti Nodemailer).
- **TypeScript full-stack** — tipe yang sama mengalir dari Prisma schema → service → route handler → komponen; banyak bug runtime di versi JavaScript yang hilang karena ini.
- **Web security dari bug nyata** — IDOR, open redirect, header injection, unauthenticated upload: memahami cara menyerang dulu, baru menutupnya.

---

## Kenapa Refactor ke Fullstack Next.js 16 App Router

1. **Satu codebase, satu server** — halaman dan API (`app/api/**/route.ts`) hidup dalam satu proses. Tidak ada CORS, tidak perlu menjalankan dua server (5173 + 3000), tidak ada perbedaan base URL antar env.
2. **SEO & performa** — App Router memberi SSR/SSG, dynamic metadata, streaming, sitemap/robots/OG image, dan caching. Versi React murni client-side (react-helmet-async) sangat lemah untuk SEO.
3. **TypeScript end-to-end** — type safety dari Prisma schema sampai komponen menghilangkan bug-bug yang kualami di versi JavaScript (misal `user_id` hilang, shape response tidak konsisten).
4. **Prisma ORM menggantikan raw SQL** — schema yang jelas, relasi, migrasi, error mapping; tidak perlu menulis `json_agg`/`GROUP BY` manual lagi.
5. **Serverless-friendly** — penyimpanan file lokal (Multer) tidak bertahan di platform serverless → Uploadthing; email via Resend; rate limiting via Upstash; semuanya terintegrasi dalam satu proses.
6. **Keamanan lebih ketat** — httpOnly cookie session menggantikan JWT di localStorage (yang rawan XSS), NextAuth untuk Google OAuth, rate limiting di semua mutasi, Origin CSRF check, validasi URL scheme, security headers.
7. **Deployment satu domain** — versi lama butuh Vercel (frontend) + Render/Heroku (backend) terpisah; versi baru cukup satu deploy ke Vercel.
8. **Ekosistem & maintainability** — middleware edge untuk proteksi route, file convention App Router yang jelas, dan kurva belajar yang relevan dengan industri saat ini.

---

## Perubahan Fitur: Ditambahkan, Dihapus, Berubah

### Ditambahkan (tidak ada di versi React + Express)
- **Liked Projects page** + tabel `project_likes` (versi lama cuma field `likes` counter)
- **Forgot / reset password** flow lengkap + ganti password di Settings
- **Resend verification email** endpoint
- **Google OAuth** (NextAuth v4)
- **Toast notification global** (slice `toast`)
- **SEO suite**: sitemap, robots, OG image, dynamic metadata
- **Live technology stats** dan filter teknologi
- **Rate limiting** di hampir semua endpoint mutasi
- **Origin CSRF check** dan validasi URL scheme
- Pagination di halaman daftar proyek
- Cache headers di endpoint GET publik

### Dihapus
- **Express backend** (`buildfolio-api/`) — semua route pindah ke Next.js Route Handlers
- **Multer + `/api/upload`** — diganti Uploadthing (tidak ada endpoint upload di server sendiri)
- **Nodemailer + Mailtrap** — diganti Resend
- **Axios** — diganti native `fetch`
- **react-helmet-async** — diganti dynamic metadata API
- **React Router DOM** — diganti App Router (file-based routing)
- **Fallback MockAPI** — tidak lagi relevan karena API sudah real sejak awal

### Berubah implementasinya
| Aspek            | Versi React + Express                         | Versi Next.js 16                                |
| ---------------- | --------------------------------------------- | ----------------------------------------------- |
| Session          | JWT di localStorage (`buildfolio_user`)       | JWT di **httpOnly cookie** (7 hari), user saja di localStorage |
| Verifikasi JWT   | `jwt.verify` di middleware Express            | `jsonwebtoken` (Node) + `jose` di edge (middleware.ts) |
| Query database   | Raw SQL: `LEFT JOIN`, `json_agg`, `GROUP BY`  | Prisma ORM relasi + batch resolution            |
| Like             | Counter biasa                                 | Tabel `project_likes` atomik + race-free        |
| Upload           | Multer disk storage (5 MB, lokal)             | Uploadthing object storage (browser → CDN)      |
| Error handling   | Manual per route                              | `apiErrors.ts` mapping kode Prisma → HTTP       |
| SEO              | CSR + react-helmet-async                      | SSR + dynamic metadata + sitemap/robots/OG      |
| Rate limiting    | Tidak ada                                     | Upstash Redis (fallback in-memory)              |
| CORS             | Perlu (origin 5173 → 3000)                    | Tidak perlu (satu origin)                       |

---

## Developer

**Kresna Satya Nugroho** — [@kisnak21](https://github.com/kisnak21)