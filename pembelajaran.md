# Buildfolio — Catatan Pembelajaran

> Proyek ini adalah tugas bootcamp fullstack dari [harisenin.com](https://harisenin.com).
> Dokumen ini merangkum apa yang aku pelajari selama membangun Buildfolio (versi React + Vite + Express) sampai akhirnya aku refactor penuh ke Next.js 16 App Router.

---

## Fitur yang Dibuat

### Publik (tanpa login)
- Homepage: Featured Projects, Categories, Trending Technologies, Community Favorites
- Halaman daftar proyek dengan pencarian, filter kategori, dan sort (terbaru/terlama/paling banyak likes/abjad)
- Halaman detail proyek dengan like, bookmark, dan komentar
- Halaman profil user publik (stats + grid proyek)
- Halaman FAQ, Contact (kirim pesan ke admin via email), Privacy Policy, Terms of Service
- SEO per halaman dengan `react-helmet-async` (Open Graph + Twitter Card meta tags)
- Layout responsif: hamburger menu mobile, grid adaptif

### Auth
- Register (nama, email, password), login, logout
- JWT authentication dengan bcrypt hashing
- Email verification (klik link verifikasi sebelum akun dianggap verified)
- Session persistence via localStorage
- Protected route untuk halaman yang butuh login

### Khusus login (Dashboard)
- Dashboard: kelola semua proyek dalam bentuk tabel (CRUD lengkap)
- Create Project dengan upload gambar thumbnail
- Edit Project, Delete Project dengan konfirmasi dialog
- Interaksi: like, bookmark, komentar
- Halaman Bookmarks dan Settings (update profil: nama & bio)

---

## Tech Stack

| Layer            | Teknologi                                                            |
| ---------------- | -------------------------------------------------------------------- |
| Frontend         | React 19 + Vite 8                                                    |
| Backend          | Node.js + Express.js (folder `buildfolio-api/`)                      |
| Database         | PostgreSQL serverless di Neon Tech                                   |
| Authentication   | JWT (`jsonwebtoken`) + `bcrypt`                                      |
| File Upload      | Multer (disk storage lokal)                                          |
| Email            | Nodemailer + Mailtrap                                                |
| Styling          | Tailwind CSS v4                                                      |
| Routing          | React Router DOM v7                                                  |
| State Management | Redux Toolkit + React Redux                                          |
| API Client       | Axios (base URL dari env `VITE_API_BASE_URL`)                        |
| SEO              | react-helmet-async                                                   |

Struktur monorepo:
```
buildfolio-react/
├── buildfolio-api/   # Express backend (config, middleware, routes, services)
└── src/              # React frontend (components, pages, store, services/api)
```

---

## Authentication

Backend (`buildfolio-api/src/services/userService.js`):

- **Register**: password di-hash dengan `bcrypt` (salt rounds 10), user dibuat dengan `uuidv4`, lalu email verifikasi dikirim berisi token verifikasi (uuid).
- **Login**: `bcrypt.compare` untuk cek password, lalu tanda tangani JWT `{ id, email, name }` dengan `expiresIn: '7d'`.
- **Verifikasi email**: endpoint `/api/users/verify-email?token=...` meng-set `is_verified = true` dan menghapus token verifikasi dari DB.
- **Middleware auth** (`authMiddleware.js`): membaca header `Authorization: Bearer <token>`, memverifikasi dengan `jwt.verify`, lalu menyimpan payload di `req.user`. Semua route protected memakainya.
- **Frontend**: token tidak disimpan eksplisit — user object disimpan ke `localStorage` (`buildfolio_user`) lewat Redux slice `auth`, dan `ProtectedRoute` memblokir akses kalau tidak ada user.

---

## Database

- PostgreSQL serverless di **Neon**, diakses lewat `pg` Pool dengan SSL.
- Tabel utama: `users`, `projects`, `categories`, `technologies`, `project_technologies` (junction), `bookmarks`, `comments`.
- Query kompleks dipelajari di `projectService.js`:
  - `LEFT JOIN` antar 5 tabel untuk mengambil author, kategori, dan teknologi
  - `json_agg(...) FILTER (WHERE ... IS NOT NULL)` untuk menggabungkan daftar teknologi per proyek jadi array JSON
  - `COALESCE` untuk fallback nilai null
  - `ILIKE` untuk pencarian case-insensitive dengan parameterized query (`$1`, `$2`) yang aman dari SQL injection
  - `GROUP BY` + `ORDER BY` dinamis berdasarkan parameter `sort`
- Seed 50 proyek ke Neon untuk data awal.

---

## API

Express REST API di `http://localhost:3000` dengan pola **routes → services**:

```
GET/POST    /api/users            GET/PATCH/DELETE /api/users/:id
POST        /api/users/login      GET  /api/users/verify-email?token=...
GET/POST    /api/projects         GET/PATCH/DELETE /api/projects/:id
GET/POST    /api/bookmarks        DELETE /api/bookmarks/:id
GET/POST    /api/comments
POST        /api/upload           POST /api/contact
```

- Query params `search`, `category`, `sort` untuk filter/sort di sisi server.
- CORS dibatasi origin frontend (`http://localhost:5173`).
- Response shape dinormalisasi `{ success, data }` dan diseragamkan di service layer frontend (`projectsApi.js`) supaya komponen tidak peduli bentuk asli API.
- Frontend punya fallback ke MockAPI (legacy) sebelum migrasi penuh ke backend real.

---

## Upload / File

- **Multer** dengan `diskStorage`: file disimpan ke folder `upload/`, nama unik `Date.now()-random.ext`.
- Validasi: hanya image (`jpeg|jpg|png|gif|webp`) — dicek dari ekstensi DAN mimetype, limit 5 MB.
- Endpoint `POST /api/upload` mengembalikan URL `http://localhost:3000/upload/<filename>`.
- File disajikan statis lewat `express.static('upload')`.
- Kekurangan yang baru kusadari belakangan: penyimpanan lokal di disk tidak cocok untuk deploy serverless (Render/Heroku ephemeral filesystem) — ini salah satu pemicu pindah ke UploadThing di versi Next.js.

---

## State Management

Redux Toolkit + React Redux, 4 slice di `src/store/redux/`:

| Slice       | Isi                                                              |
| ----------- | ---------------------------------------------------------------- |
| `auth`      | currentUser, login/logout/updateProfile, persist ke localStorage |
| `projects`  | daftar proyek, detail, CRUD — pakai `createAsyncThunk`           |
| `bookmarks` | daftar bookmark user                                            |
| `comments`  | komentar per proyek                                             |

- Async state (`pending/fulfilled/rejected`) dihandle via `createAsyncThunk`, UI menampilkan loading skeleton (`ProjectCardSkeleton`) dan error state.
- Persistensi auth sederhana: user disimpan di localStorage dan dibaca ulang saat store init.

---

## Hal Tersulit

1. **SQL query kompleks** — menggabungkan 5 tabel dengan `LEFT JOIN`, `json_agg`, `COALESCE`, dan `GROUP BY` tanpa mengacaukan data (butuh berkali-kali debugging hasil query).
2. **Menyelaraskan frontend ↔ backend** — bug-bug nyata yang kuhadapi: project creation kehilangan `user_id`, dashboard menampilkan semua proyek (bukan punya user), settings tidak persist ke API, halaman edit tanpa pengecekan ownership. Ini butuh refactor lapisan service API frontend agar bentuk response seragam.
3. **Auth flow yang benar** — hash, JWT, email verification, dan melindungi route yang tepat.
4. **Upload file + multer** — validasi file, limit ukuran, dan menghubungkan URL hasil upload ke form proyek.
5. **Dua server terpisah** — harus menjalankan frontend (5173) dan backend (3000) sekaligus, berurusan dengan CORS dan base URL yang beda-beda (env development).

---

## Hal yang Aku Pelajari

- **Backend pertama kalinya**: membangun REST API dari nol dengan Express — routing, middleware, service layer, error handling, struktur folder yang rapi.
- **SQL & relational database**: join, agregasi JSON, parameterized query, indexing dasar, desain tabel relasi many-to-many (`project_technologies`).
- **Keamanan auth**: kenapa password harus di-hash (`bcrypt`), apa itu JWT dan cara memverifikasinya, token expiration, email verification.
- **File upload**: alur multipart, `multer`, validasi mimetype/ekstensi, batas ukuran, dan serving file statis.
- **State management global**: Redux Toolkit, `createAsyncThunk` untuk async action, persist state ke localStorage.
- **Integrasi layanan pihak ketiga**: Neon (PostgreSQL serverless), Mailtrap (email testing), MockAPI (prototype cepat).
- **SEO client-side**: `react-helmet-async` untuk meta tags per halaman.
- **Pola service layer di frontend**: memisahkan komponen dari detail HTTP (axios), normalisasi response.

---

## Kenapa Refactor ke Fullstack Next.js 16 App Router

1. **Satu codebase, satu server** — API route handlers (`app/api/**/route.ts`) dan halaman hidup dalam satu proses. Tidak ada CORS, tidak perlu menjalankan dua server, tidak ada perbedaan base URL.
2. **SEO & performa yang jauh lebih baik** — App Router memberi SSR/SSG, dynamic metadata per halaman, sitemap/robots/opengraph-image, streaming, dan caching. Versi React murni client-side sangat lemah di SEO.
3. **TypeScript** — type safety di seluruh tumpukan (frontend, API, dan Prisma schema) menghilangkan banyak bug runtime yang kualami (misal `user_id` hilang, shape response tidak konsisten).
4. **Prisma ORM menggantikan raw SQL** — schema yang jelas, migrasi versi, tipe aman; tidak perlu menulis `json_agg`/`GROUP BY` manual.
5. **Serverless-friendly** — penyimpanan file lokal (Multer) tidak bertahan di platform serverless; pindah ke UploadThing. Email via Resend, rate limiting via Upstash, edge JWT verification — semua terintegrasi dalam satu proses.
6. **Keamanan lebih ketat** — httpOnly cookie session menggantikan JWT di localStorage (yang rawan XSS), NextAuth untuk Google OAuth, rate limiting pada mutasi password/proyek, Origin CSRF check, validasi URL scheme.
7. **Deployment satu domain** — versi lama butuh Vercel (frontend) + Render/Heroku (backend) yang terpisah; versi baru cukup satu deploy ke Vercel.
8. **Ekosistem & maintainability** — middleware edge untuk proteksi route, file convention App Router yang jelas, dan kurva belajar yang lebih relevan dengan industri.

---

## Developer

**Kresna Satya Nugroho** — [@kisnak21](https://github.com/kisnak21)