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
| Authentication   | bcrypt + JWT (httpOnly cookie) + NextAuth v4 (Google OAuth) |
| Email            | Nodemailer + Mailtrap                                       |
| File Upload      | Uploadthing                                                 |
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
- Neo-brutalism UI, loading skeletons, and global toast notifications

### Auth

- Register with name, email, password
- Email verification via Nodemailer + Mailtrap
- Login with bcrypt password comparison and JWT token
- Session persisted via **httpOnly cookie** (JWT in cookie, 7-day expiry) — secure, survives page refresh, protected from XSS
- Logout clears session cookie server-side
- **OAuth (Google login)** via NextAuth v4 — one-click sign-in, auto-creates local user record, syncs to `buildfolio_token` httpOnly cookie
- **Rate limiting** on authentication endpoints (Login: 10 attempts/15m; Register: 5 registrations/hour per IP) to prevent brute-force attacks

### Protected (requires login)

- **Dashboard** — stats (total projects, likes received, bookmarks), project table with Edit/Delete
- **Create Project** — add a new project with title, description, category, technologies, author, GitHub, and live URL
- **Edit Project** — update any project you own (ownership enforced)
- **Delete Project** — with confirmation dialog
- **Bookmarks** — save and view bookmarked projects (persisted to database)
- **Liked Projects** — view projects you have liked; likes can be toggled
- **Comments** — post and delete comments on project detail pages (persisted to database)
- **Settings** — update name and bio (persisted to database)

### Static Pages

- FAQ, Contact us (with email form), Privacy Policy, Terms of Service
- 404 page for unmatched routes

---

## Project Structure

```
src/
├── app/
│   ├── api/                  # Next.js API route handlers
│   │   ├── auth/             # NextAuth handler + session → JWT cookie exchange
│   │   ├── users/            # Register, login, logout, verify-email, CRUD
│   │   ├── projects/         # GET/filter/sort/search/pagination, CRUD, like/unlike, liked projects
│   │   ├── bookmarks/        # GET by user, POST, DELETE
│   │   ├── comments/         # GET by project, POST, DELETE
│   │   ├── contact/          # POST send email
│   │   └── uploadthing/      # Uploadthing file handler
│   ├── auth/google-callback  # Post-OAuth redirect page
│   ├── dashboard/            # Dashboard, New Project, Edit Project
│   ├── projects/             # All Projects, Project Detail
│   ├── u/[author]/           # User Profile
│   ├── bookmarks/            # Bookmarks page
│   ├── liked/                # Liked projects page
│   ├── settings/             # Settings page
│   ├── login/                # Login page
│   ├── register/             # Register page
│   ├── faq/                  # FAQ page
│   ├── contact/              # Contact page
│   ├── privacy/              # Privacy Policy page
│   ├── terms/                # Terms of Service page
│   ├── layout.tsx            # Root layout with Redux Provider
│   ├── page.tsx              # Homepage
│   └── not-found.tsx         # 404 page
├── components/
│   ├── auth/                 # AuthSessionProvider
│   ├── layout/               # Header, Footer, AuthCard, AvatarDropdown
│   ├── home/                 # Hero, Section, ProjectCard, CategoryCard, TechPill
│   ├── dashboard/            # ProjectForm
│   └── ui/                   # Button, Input, Checkbox, Divider, ConfirmDialog, GoogleButton, Toast, ProjectCardSkeleton, ProjectDetailSkeleton
├── generated/prisma/         # Generated Prisma Client (via `npx prisma generate`)
├── lib/
│   ├── api/                  # Client-side Axios service files
│   ├── services/             # Server-side Prisma service files
│   ├── middleware/           # JWT auth middleware for API routes
│   ├── data/                 # Static seed data (categories, technologies)
│   ├── db.ts                 # Prisma Client singleton (pg Pool + @prisma/adapter-pg)
│   ├── apiErrors.ts          # Error mapping (Prisma error codes → HTTP responses)
│   ├── auth.ts               # JWT sign/verify helpers
│   ├── email.ts              # Nodemailer transporter
│   ├── rateLimit.ts          # In-memory rate limiting middleware
│   ├── utils.ts              # Shared utilities (cn, etc.)
│   └── uploadthing.ts        # Uploadthing config
├── middleware.ts             # Route protection (protected + guest-only pages)
└── store/
    └── redux/                # store, provider, typed hooks, slices (projects, auth, bookmarks, comments, likes, toast)
```

Prisma-related files live at the project root:

```
prisma/
└── schema.prisma            # Prisma schema (models mapped to snake_case tables)
prisma.config.ts             # Prisma config (datasource URL from DATABASE_URL)
migrations/                  # Local-only SQL scripts (gitignored): schema + seed data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Neon](https://neon.tech) PostgreSQL database
- A [Mailtrap](https://mailtrap.io) account for email testing
- An [Uploadthing](https://uploadthing.com) account for file uploads

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
```

> Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth client ID (Web application). Set authorized JS origin to `http://localhost:3000` and redirect URI to `http://localhost:3000/api/auth/callback/google`. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
>
> Email is sent via [Resend](https://resend.com). Add your sending domain in the Resend dashboard and verify the DNS records (SPF/DKIM/DMARC), or omit `RESEND_FROM_EMAIL` to fall back to `onboarding@resend.dev`. Rate limiting is backed by [Upstash Redis](https://upstash.com) when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set (in-memory fallback otherwise).

### Database Setup

1. Configure `DATABASE_URL` in `.env.local`
2. Set up the schema. Run the SQL scripts in the local `/migrations` folder in your Neon SQL editor, or push the Prisma schema directly:
   ```bash
   npx prisma db push
   ```
3. Generate the Prisma client (also runs automatically via `postinstall` after `npm install`):
   ```bash
   npx prisma generate
   ```

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
| GET    | `/api/auth/[...nextauth]`        | —    | NextAuth Google OAuth handler         |
| POST   | `/api/auth/exchange`             | —    | Exchange NextAuth session → app JWT cookie |

---

## Known Limitations

- **SQL migrations are kept local-only** — the `/migrations` folder is gitignored; schema changes are applied via `npx prisma db push` or run manually in the Neon SQL editor.
- **File upload UI is not yet wired** — the Uploadthing config and API route exist, but project thumbnail upload is not exposed in the UI yet.
- **Rate limiting is in-memory** — resets on server restart; fine for a single serverless instance.

## Planned Improvements

- [x] Prisma ORM migration from raw pg queries
- [x] Deployment to Vercel with environment variable configuration
- [x] Restyle to playful neo-brutalism UI globally
- [x] Real-time like/unlike synchronization with dedicated `project_likes` table
- [ ] Project thumbnail upload via Uploadthing (UI wiring)
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
- [Mailtrap](https://mailtrap.io) — email testing
- [Dev.to](https://dev.to) — card design inspiration
- [Product Hunt](https://www.producthunt.com) — layout inspiration
- [GitHub Explore](https://github.com/explore) — project card aesthetic
