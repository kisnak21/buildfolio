# Rencana Super Admin Dashboard — Buildfolio

> Status: **Fase 0, 1, & 2 selesai** (19 Aug 2026) · tersisa: grafik lanjutan, flag/report konten
> Keputusan: role string di DB · bootstrap via promote script · `requireAdmin` cek role ke DB · fase 1 lengkap 5 halaman

## Fase 0 — Fondasi role (wajib duluan)

1. `prisma/migrations/007_add_role.sql`:
   `ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';`
2. Schema: `role String @default("user") @db.VarChar(20)` di model `User`
3. `src/lib/auth.ts`: `signToken`/`verifyToken` ikut membawa klaim `role`
4. `src/lib/middleware/verifyJwtEdge.ts`: `EdgeJwtPayload` + `role` (gate cepat untuk middleware)
5. `src/lib/middleware/authMiddleware.ts`: helper `requireAdmin(req)` — verifikasi JWT **plus cek role ke DB** (1 query/request, pencabutan instan, tidak percaya klaim saja) → 403 jika bukan admin
6. `scripts/promote-admin.mjs` — bootstrap sekali: `node scripts/promote-admin.mjs <email>` → `UPDATE role='admin'`
7. `src/middleware.ts`: tambah `/admin/:path*` ke matcher

## Fase 1 — Halaman & API (mode Operate)

- Shell `/admin` sidebar: Overview · Users · Projects · Comments · Categories/Tech
- Overview: 5 stat cards (users, projects, comments, likes, bookmarks) + bar chart 14 hari (div, tanpa dependency) + recent signups
- Users: tabel + search, verifikasi manual, promote/demote, hapus (ConfirmDialog)
- Projects & Comments: daftar semua + hapus (moderasi konten)
- Categories & Technologies: CRUD ringan
- API `src/app/api/admin/*`: stats, users, projects, comments, categories, technologies — semua `requireAdmin`
- Design: reuse `Button`/`Alert`/`EmptyState`/`ConfirmDialog`/tokens; komponen baru `DataTable`, `AdminStatCard`, `AdminSidebar`
- Catatan: frontend gate via klaim JWT (middleware), backend gate via DB (autoritatif)

## Fase 2 — Logs & lanjutan

- **Audit log aktivitas admin — SELESAI (19 Aug 2026):**
  - Model `AuditLog` (tabel `audit_logs`): actorId/actorName/actorEmail snapshot, action, targetType/targetId/targetName, metadata JSON, ip, userAgent, createdAt; index action/actorId/targetId/createdAt
  - Helper `logAudit()` (src/lib/audit.ts) — never throws; `requestContext()` ekstrak IP + user-agent dari request
  - Aksi tercatat: `user.promote/demote/verify/delete`, `project.delete`, `comment.delete`, `category.create/rename/delete`, `tech.create/delete`, `auth.login_fail` (invalid + rate limited + belum verifikasi), `auth.register`, `auth.password_reset` (token requested)
  - Tidak dicatat: like, bookmark, view (noise) — sesuai keputusan
  - API `GET /api/admin/audit-logs` (requireAdmin): filter action/search/from/to + pagination server-side (max 100/baris)
  - Halaman `/admin/audit-logs`: tabel + filter + pagination + export CSV/JSON (max 5000 baris)
  - Keputusan: tanpa retensi otomatis (log tersimpan permanen) — bisa ditambah cron nanti
- Grafik lanjutan (growth kumulatif, distribusi kategori) — SELESAI (19 Aug 2026):
  - `getAdminStats` + query `generate_series` untuk proyek 14 hari; `categoryDist` via `_count`
  - `GrowthChart` (SVG inline 2 seri, tanpa dependency) — users & projects kumulatif
  - Kartu distribusi kategori (bar horizontal) + tombol manage categories
- Flag/report konten oleh user — SELESAI (19 Aug 2026):
  - Model `ContentFlag` + migration `0002_content_flags` (applied di Neon)
  - `POST /api/flags` (auth, rate limit 10/jam, guard duplikat pending, reason enum + details ≤1000)
  - `GET /api/admin/flags` (filter status + pagination, snapshot nama target project/comment)
  - `PATCH /api/admin/flags/[id]` resolve/dismiss + audit `flag.create/resolve/dismiss`
  - Halaman `/admin/flags`: tab status, tabel, resolve/dismiss, link ke target
  - UI user: tombol Report di detail project + tiap komentar (modal reason + details, sembunyi setelah dilaporkan)

## Aksi manual / prasyarat

1. Jalankan promote script sekali saat fase 0 selesai
2. Migrasi DB via `prisma migrate deploy` / db push sesuai alur yang berjalan