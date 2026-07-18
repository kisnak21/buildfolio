# Plan: Email Verification & Password Reset (OTP)
**Tujuan:** Aktifkan verifikasi email untuk pengguna baru dan tambahkan pemulihan kata sandi melalui OTP flow.
**Sejarah langkah:** 2 penting: Verifikasi email (link/OTP) setelah registrasi, otentikasi setelah pengguna mengklik link. Verifikasi token reset untuk forgotten password.

## Bagian 1: Perubahan Database
- Tabel `users`
  - `email_verified`: boolean DEFAULT false
  - `verification_token`: text NULLABLE
  - `verification_token_expiry`: timestampz (atau datetime) NULLABLE
  - `last_reset_token`: text (opsional, digunakan untuk reset password via Google?)
  - `reset_token_expiry`: timestampz (opsional)
- Migrasi: tambahkan kolom via SQLAlchemy/Prisma/duckdb? (Terdapat `users` di kode (Prisma + Neon)?)Pilih kerangka kerja yang relevan, fokus pada pelaksanaan.

## Bagian 2: Services Email Verification
- `src/lib/services/emailVerificationService.ts`
  - `generateVerificationToken()`: token acak
  - `setEmailVerification(userId, token, expiry)` bisa pakai Postres SQL (returns raw user).
  - `sendVerificationEmail(email, token)` via Nodemailer + Mailtrap (template HTML dengan tautan https://yourdomain.com/api/users/verify?token=TOKEN)
  - `verifyToken(token)`: hitung waktu, perbarui `email_verified` user, hapus token.
- `src/lib/services/passwordResetService.ts`
  - `generateResetToken()`, `setResetToken`, `sendResetEmail`, `resetPasswordWithToken(token, newPassword)`

## Bagian 3: API Endpoints
- `src/app/api/users/verify/route.ts`
  - GET (atau POST) query param `token`
  - Panggil emailVerificationService.verifyToken
  - Respons sukses: `200 { success: true }` (redirect frontend user)
- `src/app/api/users/reset-password/route.ts`
  - POST body `{ email }` (atau `token`?)
  - Generate reset token, kirim email.
  - Endpoint `POST /api/users/reset-password/confirm`
  - Body: `{ token, newPassword }`
  - Set password baru via userService.changePassword (atau update langsung)
  - Hapus token setelah.
- `src/app/api/users/request-verification/route.ts` (opsional): kirim ulang verifikasi untuk pengguna yang belum diverifikasi.

## Bagian 4: Frontend Updates
- `src/app/register/RegisterClient.tsx`
  - Setelah registration sukses, tampilkan pesan “Periksa email Anda untuk verifikasi”
  - Link langsung ke login setelah klik link verifikasi (atau bawa ke halaman verifikasi).
- Komponen verifikasi email: bisa buat halaman baru `/verify-email` untuk memvalidasi token via query param.
  - Tampilkan spinner, jika token valid redirect ke `/login` (atau `/dashboard`), jika invalid tampilkan error.
- Komponen forgotten password: buat tombol di `/login` → input email → kirim reset token.
  - Tampilkan form input token + password baru.
- Perbarui UI register/login untuk menampilkan status verifikasi.

## Bagian 5: Integrasi & Konsistensi
- Pastikan JWT auth middleware hanya mengizinkan request GET pada route sensitif setelah verifikasi? Jika ingin enforce, tambahkan pengecekan kepemilikan.
- Buat email verification link di layanan (https://buildfolio.dev/app/verify-email?token=XYZ) dan redirect ke halaman verifikasi.
- Kirim email reset password via Nodemailer (untuk keringanan, kita juga bisa menggunakan template email untuk tema.
- Sesuaikan pengecekan token di backend (keamanan: expiry, hash token di DB? Kalau pakai raw string tolong jangan raw), namun proyek saat ini tidak menggunakan raw; namun linnya hal.

## Bagian 6: Testing
- Unit test services: generate token, verifikasi (berhasil/gagak)
- Integration test endpoint: hit user registration -> kirim verifikasi -> hit verify endpoint.
- E2E test lewat Playwright (opsional) untuk flow email verification.
- Pengujian rantai regresif untuk pastikan login gagal jika email tidak terverifikasi (opsional).

## Bagian 7: Linting & Deploy
- Tambahkan migrasi schema untuk DB (.prisma push atau komposisi SQL).
- Di CI, jalankan `npx prisma generate` / `pnpm db-push`? (Pilih yang kamu punya).
- Setelah plan_executed, perbarui README:
  - Daftar di bawah Auth: Email verification (link/OTP) dan Forgot password via OTP.
  - Tombol CTA UI login/register.

## Bagian 8: Docs & Perencanaan
- Tambahkan catatan lower-level di README seperti “Verifikasi akun diperlukan sebelum mengakses dashboard."
- Catat alur fungsi di file docs (opsional)

## Checklist
- [ ] Tambahkan schema DB (email_verified, verification_token, token_expiry)
- [ ] Buat emailVerificationService
- [ ] Buat passwordResetService
- [ ] Tulis endpoint API
- [ ] Perbarui client UI frontend
- [ ] Tulis unit test
- [ ] Verifikasi integrasi end-to-end (manual/prototype)
- [ ] Gunakan CI pipeline (linting, type-check, migration script)
- [ ] Perbarui README

## Prioritas minimal
1. Verifikasi email (link) paling prioritas
2. Reset OTP password

## Jenis masalah terkait (jika mau)
- Migrasi database
- Konfigurasi Nodemailer
- Update UI disamping ini
- Penanganan error dan status

## Next steps setelah realisasi
- Fitur otentikasi Google (Auth.js v5)
- Generator proyek AI
- Dashboard admin

## Catatan
tableau (TL, tidak kurang) hanya untuk tujuan perencanaan sekarang
