# Buildfolio

A full-stack developer platform to discover projects, share ideas, and build a portfolio. Inspired by GitHub Explore, Product Hunt, and Dev.to — focused entirely on developer project showcases.

> **This project is still ongoing.** Features and architecture are actively being developed and improved.

> This project was created as part of the **Fullstack Developer Bootcamp** program at [harisenin.com](https://harisenin.com).

> **This is the Next.js migration** of the original React (Vite) version. See the related repositories below.

---

## Related Repositories

| Repository                                                       | Description                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| [buildfolio](https://github.com/kisnak21/buildfolio)             | **This repo** — Next.js 16 full-stack version (current)       |
| [buildfolio-react](https://github.com/kisnak21/buildfolio-react) | React (Vite) + Redux version with MockAPI and Express backend |
| [buildfolio-api](https://github.com/kisnak21/buildfolio-api)     | Standalone Express.js REST API with PostgreSQL (Neon)         |

---

## Overview

Buildfolio lets developers:

- Discover projects built by other developers
- Showcase their own projects with tech stack, links, and descriptions
- Browse by category and trending technology
- Like and bookmark projects from the community
- Leave comments on projects
- Manage projects via a personal dashboard (Create, Read, Update, Delete)
- Register and log in with real authentication and email verification
- View public developer profiles
- Moderate the community via an admin dashboard (users, projects, comments, content flags, audit logs)

---

## Tech Stack

| Layer            | Choice                                                      |
| ---------------- | ----------------------------------------------------------- |
| Framework        | Next.js 16 (App Router)                                     |
| Language         | TypeScript                                                  |
| Styling          | Tailwind CSS v4 + custom neo-brutalism components           |
| State Management | Redux Toolkit + React Redux                                 |
| Database         | PostgreSQL (Neon)                                           |
| ORM / Query      | Prisma ORM (v7) + @prisma/adapter-pg                        |
| Authentication   | bcrypt + JWT (httpOnly cookie, jose edge verification) + NextAuth v4 (Google OAuth) |
| Email            | Resend                                                      |
| File Upload      | Uploadthing                                                 |
| Rate Limiting    | Upstash Redis (@upstash/ratelimit, in-memory fallback)      |
| API              | Next.js API Route Handlers (full-stack, no separate server) |

---

## Features

### Public

- Homepage with Featured Projects, Browse by Category, Trending Technologies, Community Favorites
- Search projects by title or description
- Filter by category and technology
- Sort by newest, most liked, oldest, or title (alphabetical)
- View all projects on a dedicated page with pagination (6 projects per page)
- Like and unlike projects once per authenticated user (persisted via `project_likes`)
- View public user profiles with stats
- Server-rendered project detail and profile pages with dynamic metadata (SEO), `sitemap.xml`, `robots.txt`, and a generated Open Graph image
- Neo-brutalism UI, loading skeletons, and global toast notifications

### Auth

- Register with name, email, password
- Email verification via Resend (verify-email page)
- Resend verification email if the first one is missed
- Forgot / reset password via emailed link (token with expiry)
- Login with bcrypt password comparison and JWT token
- Session persisted via **httpOnly cookie** (JWT in cookie, 7-day expiry) — secure, survives page refresh, protected from XSS; verified with `jose` on the edge
- Logout clears session cookie server-side
- **OAuth (Google login)** via NextAuth v4 — one-click sign-in, auto-creates local user record, syncs to `buildfolio_token` httpOnly cookie
- **Rate limiting** on auth and mutation endpoints (Login: 10 attempts/15m; Register: 5 registrations/hour per IP; plus limits on password and project mutations) — backed by Upstash Redis, in-memory fallback locally
- **CSRF protection** (origin check) on state-changing endpoints, URL scheme validation for external links

### Protected (requires login)

- **Dashboard** — stats (total projects, likes received, bookmarks), project table with Edit/Delete
- **Create Project** — add a new project with title, description, category, technologies, author, GitHub, live URL, and thumbnail upload via Uploadthing
- **Edit Project** — update any project you own (ownership enforced)
- **Delete Project** — with confirmation dialog
- **Bookmarks** — save and view bookmarked projects (persisted to database)
- **Liked Projects** — view projects you have liked; likes can be toggled
- **Comments** — post and delete comments on project detail pages (persisted to database)
- **Settings** — update name and bio, or change password (persisted to database)

### Admin (role `admin`)

- **Dashboard** (`/admin`) — stat cards (users, projects, comments, likes, bookmarks), 14-day signups bar chart, cumulative growth chart (inline SVG, users vs projects), category distribution bars, recent signups
- **Users** — searchable table, manual verification, promote/demote admin, delete
- **Projects & Comments** — full lists with delete (content moderation)
- **Categories & Technologies** — lightweight CRUD
- **Content Flags** — review queue for user reports on projects/comments (reason + optional details), resolve/dismiss with audit trail
- **Audit Logs** — every admin action and auth event recorded (actor snapshot, IP, user-agent, metadata); filter by action/search/date, pagination, CSV/JSON export
- Backend gate via `requireAdmin` (DB role check, authoritative); frontend gate via JWT claim

### Observability & CI/CD

- **Structured logging** — pino JSON logs on the server (`register` + `onRequestError` via Next.js instrumentation)
- **Client error ingestion** — `/api/log-error` (same-origin + rate limited) feeds global `error.tsx` digests into server logs
- **CI quality gate** — GitHub Actions: lint, typecheck, build on every push
- **Uptime monitoring** — scheduled check of the production URL every 6 hours
- **Migrations on deploy** — `vercel.json` runs `prisma migrate deploy` before `next build`

### Static Pages

- FAQ, Contact us (with email form routed to your inbox), Privacy Policy, Terms of Service
- Forgot Password, Reset Password, and Verify Email flow pages
- 404 page for unmatched routes

---

## Project Structure

```
src/
├── app/
│   ├── api/                  # Next.js API route handlers
│   │   ├── auth/             # NextAuth handler + session → JWT cookie exchange
│   │   ├── users/            # Register, login, logout, verify-email, forgot/reset password, resend-verification, CRUD, change password
│   │   ├── projects/         # GET/filter/sort/search/pagination, CRUD, like/unlike, liked projects
│   │   ├── bookmarks/        # GET by user, POST, DELETE
│   │   ├── comments/         # GET by project, POST, DELETE
│   │   ├── contact/          # POST send email
│   │   ├── flags/            # POST content report (auth, rate limited)
│   │   ├── admin/            # Admin API: stats, users, projects, comments, categories, technologies, flags, audit-logs
│   │   ├── log-error/        # Client error ingestion (same-origin + rate limited)
│   │   └── uploadthing/      # Uploadthing file handler
│   ├── admin/                # Admin dashboard (Overview, Users, Projects, Comments, Categories & Tech, Flags, Audit Logs)
│   ├── auth/google-callback  # Post-OAuth redirect page
│   ├── dashboard/            # Dashboard, New Project, Edit Project
│   ├── projects/             # All Projects, Project Detail (server-rendered, dynamic metadata)
│   ├── u/[author]/           # User Profile (server-rendered, dynamic metadata)
│   ├── bookmarks/            # Bookmarks page
│   ├── liked/                # Liked projects page
│   ├── settings/             # Settings page (profile + change password)
│   ├── login/                # Login page
│   ├── register/             # Register page
│   ├── forgot-password/      # Forgot password page
│   ├── reset-password/       # Reset password page
│   ├── verify-email/         # Email verification page
│   ├── faq/                  # FAQ page
│   ├── contact/              # Contact page
│   ├── privacy/              # Privacy Policy page
│   ├── terms/                # Terms of Service page
│   ├── layout.tsx            # Root layout with Redux Provider
│   ├── page.tsx              # Homepage
│   ├── error.tsx / loading.tsx  # Global error & loading UI
│   ├── sitemap.ts / robots.ts   # SEO
│   ├── opengraph-image.tsx      # Generated OG image
│   └── not-found.tsx         # 404 page
├── components/
│   ├── auth/                 # AuthSessionProvider
│   ├── layout/               # Header, Footer, AuthCard, AvatarDropdown
│   ├── home/                 # Hero, Section, ProjectCard, CategoryCard, TechPill
│   ├── dashboard/            # ProjectForm (with Uploadthing thumbnail upload)
│   └── ui/                   # Button, Input, Checkbox, Textarea, Alert, Divider, ConfirmDialog, EmptyState, GoogleButton, Toast, ProjectCardSkeleton, ProjectDetailSkeleton
├── generated/prisma/         # Generated Prisma Client (via `npx prisma generate`)
├── lib/
│   ├── api/                  # Fetch-based client API files (no axios) + cache headers helper
│   ├── services/             # Server-side Prisma service files (incl. admin stats, flags)
│   ├── middleware/           # JWT auth middleware for API routes + edge JWT verification (jose)
│   ├── data/                 # Static seed data (categories, technologies)
│   ├── db.ts                 # Prisma Client singleton (pg Pool + @prisma/adapter-pg)
│   ├── apiErrors.ts          # Error mapping (Prisma error codes → HTTP responses)
│   ├── auth.ts               # JWT sign/verify helpers
│   ├── audit.ts              # Audit log helper (never throws) + request context extraction
│   ├── email.ts              # Resend transporter
│   ├── logger.ts             # pino structured logger
│   ├── rateLimit.ts          # Upstash Redis rate limiting (in-memory fallback)
│   ├── uploadthing.ts        # Uploadthing config
│   ├── uploadthing-client.ts # Uploadthing client-side config
│   └── utils.ts              # Shared utilities (cn, etc.)
├── instrumentation.ts        # Observability: pino register + onRequestError reporting
├── middleware.ts             # Route protection (protected + guest-only pages, edge JWT check)
└── store/
    └── redux/                # store, provider, typed hooks, slices (projects, auth, bookmarks, comments, likes, toast)
```

Prisma-related files live at the project root:

```
prisma/
└── schema.prisma            # Prisma schema (models mapped to snake_case tables)
prisma.config.ts             # Prisma config (datasource URL from DATABASE_URL)
migrations/                  # Versioned migrations (0001_init, 0002_content_flags) — tracked in git, applied via `prisma migrate deploy`
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Neon](https://neon.tech) PostgreSQL database
- A [Resend](https://resend.com) account for email
- An [Uploadthing](https://uploadthing.com) account for file uploads
- (Optional) An [Upstash](https://upstash.com) Redis account for distributed rate limiting

### Installation

```bash
git clone https://github.com/kisnak21/buildfolio
cd buildfolio
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```
DATABASE_URL=postgresql://username:***@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_jwt_secret_key
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
NEXT_PUBLIC_REAL_API_BASE_URL=/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
CONTACT_RECIPIENT_EMAIL=you@yourdomain.com
```

> Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth client ID (Web application). Set authorized JS origin to `http://localhost:3000` and redirect URI to `http://localhost:3000/api/auth/callback/google`. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
>
> Email is sent via [Resend](https://resend.com). Add your sending domain in the Resend dashboard and verify the DNS records (SPF/DKIM/DMARC), or omit `RESEND_FROM_EMAIL` to fall back to `onboarding@resend.dev`. Rate limiting is backed by [Upstash Redis](https://upstash.com) when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set (in-memory fallback otherwise). `CONTACT_RECIPIENT_EMAIL` is the inbox that receives contact-form emails.

### Database Setup

1. Configure `DATABASE_URL` in `.env.local`
2. Apply the versioned migrations (kept in `prisma/migrations/`):
   ```bash
   npx prisma migrate deploy
   ```
3. Generate the Prisma client (also runs automatically via `postinstall` after `npm install`):
   ```bash
   npx prisma generate
   ```

> On Vercel the same migrations run automatically before each build via `vercel.json` (`prisma migrate deploy && next build`).

### Running Locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## API Endpoints

| Method | Endpoint                         | Auth | Description                           |
| ------ | -------------------------------- | ---- | ------------------------------------- |
| GET    | `/api/users`                     | Yes | Get current user profile              |
| POST   | `/api/users`                     | —    | Register                              |
| POST   | `/api/users/login`               | —    | Login (unverified users get 403)      |
| POST   | `/api/users/forgot-password`     | —    | Request password reset email          |
| POST   | `/api/users/reset-password`      | —    | Reset password with token             |
| POST   | `/api/users/resend-verification` | —    | Resend verification email             |
| GET    | `/api/users/verify-email?token=` | —    | Verify email                          |
| GET    | `/api/users/:id`                 | —    | Get user by ID                        |
| PATCH  | `/api/users/:id`                 | Yes | Update user                           |
| DELETE | `/api/users/:id`                 | Yes | Delete user                           |
| PATCH  | `/api/users/:id/password`        | Yes | Change password                       |
| GET    | `/api/projects`                  | —    | Get all projects (filter/sort/search) |
| POST   | `/api/projects`                  | Yes | Create project                        |
| GET    | `/api/projects/:id`              | —    | Get project by ID                     |
| PATCH  | `/api/projects/:id`              | Yes | Update project                        |
| DELETE | `/api/projects/:id`              | Yes | Delete project                        |
| POST   | `/api/projects/:id/like`         | Yes | Toggle like on a project              |
| GET    | `/api/projects/liked`            | Yes | Get liked projects for user           |
| GET    | `/api/bookmarks?userId=`         | —    | Get bookmarks by user                 |
| POST   | `/api/bookmarks`                 | Yes | Add bookmark                          |
| DELETE | `/api/bookmarks/:id`             | Yes | Remove bookmark                       |
| GET    | `/api/comments?projectId=`       | —    | Get comments by project               |
| POST   | `/api/comments`                  | Yes | Add comment                           |
| DELETE | `/api/comments/:id`              | Yes | Delete comment                        |
| POST   | `/api/contact`                   | —    | Send contact email                    |
| POST   | `/api/flags`                     | Yes | Report a project or comment (rate limited, duplicate-pending guarded) |
| GET    | `/api/admin/stats`               | Admin | Dashboard stats (incl. 14-day charts) |
| GET    | `/api/admin/users`               | Admin | User list |
| PATCH/DELETE | `/api/admin/users/:id`       | Admin | Verify / promote / demote / delete user |
| GET    | `/api/admin/projects`            | Admin | Project moderation list |
| DELETE | `/api/admin/projects/:id`        | Admin | Delete project |
| GET    | `/api/admin/comments`            | Admin | Comment moderation list |
| DELETE | `/api/admin/comments/:id`        | Admin | Delete comment |
| GET/POST | `/api/admin/categories`, `/api/admin/technologies` | Admin | Category & tech CRUD (plus `/:id` PATCH/DELETE) |
| GET    | `/api/admin/flags`               | Admin | Content flag queue (status filter + pagination) |
| PATCH  | `/api/admin/flags/:id`           | Admin | Resolve or dismiss a flag |
| GET    | `/api/admin/audit-logs`          | Admin | Audit log (filter/search/date + pagination) |
| POST   | `/api/log-error`                 | —    | Client error ingestion (same-origin, rate limited) |
| GET    | `/api/auth/[...nextauth]`        | —    | NextAuth Google OAuth handler         |
| POST   | `/api/auth/exchange`             | —    | Exchange NextAuth session → app JWT cookie |

---

## Known Limitations

- **Rate limiting falls back to in-memory without Upstash** — resets on server restart; fine for local development, but configure `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` for a single shared store in production.
- **`middleware.ts` JWT check is structural** (3-part token) — full signature verification happens in API routes; the edge check is defense-in-depth only.

## Planned Improvements

- [x] Prisma ORM migration from raw pg queries
- [x] Deployment to Vercel with environment variable configuration
- [x] Restyle to playful neo-brutalism UI globally
- [x] Real-time like/unlike synchronization with dedicated `project_likes` table
- [x] Resend email delivery, email verification, and password reset flow
- [x] Upstash Redis rate limiting and CSRF/security hardening
- [x] SEO (sitemap, robots, OG image, dynamic metadata) + thumbnail upload via Uploadthing
- [x] Admin dashboard (users/projects/comments/categories moderation, audit logs, content flags, growth charts)
- [x] CI/CD quality gate, observability (pino + client error ingestion), and uptime monitoring
- [ ] AI features — project description generator, README generator, idea generator (Groq API + Llama)
- [ ] Public API documentation page

---

## Developer

**Kresna Satya Nugroho**
GitHub: [@kisnak21](https://github.com/kisnak21)

---

## References

- [Next.js](https://nextjs.org) — full-stack React framework
- [Prisma](https://www.prisma.io) — type-safe ORM for PostgreSQL
- [Neon](https://neon.tech) — serverless PostgreSQL
- [Redux Toolkit](https://redux-toolkit.js.org) — state management
- [Uploadthing](https://uploadthing.com) — file uploads for Next.js
- [DiceBear](https://www.dicebear.com) — pixel-art avatar generation
- [Resend](https://resend.com) — email delivery
- [Upstash](https://upstash.com) — Redis rate limiting
- [Dev.to](https://dev.to) — card design inspiration
- [Product Hunt](https://www.producthunt.com) — layout inspiration
- [GitHub Explore](https://github.com/explore) — project card aesthetic
