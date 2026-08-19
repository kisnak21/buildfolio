# Rencana CI/CD & Observability — Buildfolio

> Status: **SELESAI** (19 Aug 2026) — semua bagian dieksekusi
> Keputusan: migrate DB di build Vercel · structured log (pino) · uptime via cron internal

## 1. CI quality gate — `.github/workflows/ci.yml` ✅

- Trigger: `pull_request` + `push` ke `main`
- Steps: `npm ci` → `npx prisma generate` → `eslint` → `tsc --noEmit` → `next build`
- **Prasyarat manual:** tambah GitHub secret `DATABASE_URL` (boleh Neon prod — akses CI read-only)
- Catatan: `next build` memanggil sitemap → Prisma, sehingga butuh `DATABASE_URL` di CI

## 2. Deploy & migrasi — `vercel.json` ✅

- `buildCommand: "prisma migrate deploy && next build"`
- Baseline migration `0001_init` dibuat via `prisma migrate diff --from-empty` + di-mark applied di DB prod (`migrate resolve --applied`) — history tersinkron dengan schema yang sudah ada
- Deploy app tetap via Vercel dashboard; migrasi otomatis tiap build, tanpa race

## 3. Observability

| File | Isi | Status |
|---|---|---|
| `src/lib/logger.ts` | pino singleton, level dari `LOG_LEVEL`, JSON ke stdout, `base.service=buildfolio` | ✅ |
| `src/instrumentation.ts` | `register()` + `onRequestError()` log error server terpusat (Next 16) | ✅ |
| `src/app/api/health/route.ts` | `SELECT 1` probe, return `{ok, db, uptime, ts}`, `Cache-Control: no-store` | ✅ |
| `src/app/api/log-error/route.ts` | Terima error client (rate limit 60/min/IP, same-origin check) → pino.error, 204 | ✅ |
| `src/app/error.tsx` | Kirim client error (message/digest/path) ke `/api/log-error` | ✅ |
| `package.json` | `pino@10`, script `typecheck: tsc --noEmit` | ✅ |

## 4. Uptime — `.github/workflows/uptime.yml` ✅

- Cron tiap 6 jam (+ manual dispatch): curl `/` dan `/api/health`, fail jika non-2xx → terlihat di Actions + notifikasi GitHub
- **Prasyarat manual:** set repository variable `APP_URL` (mis. `https://buildfolio.vercel.app`)

## Aksi manual setelah eksekusi

1. GitHub repo settings → Secrets → `DATABASE_URL` (untuk CI)
2. GitHub repo settings → Variables → `APP_URL` (untuk uptime)