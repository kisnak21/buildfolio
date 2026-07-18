# Buildfolio

A full-stack developer platform to discover projects, share ideas, and build a portfolio. Inspired by GitHub Explore, Product Hunt, and Dev.to — focused entirely on developer project showcases.

> ⚠️ **This project is still ongoing.** Features and architecture are actively being developed and improved.

> 📚 This project was created as part of the **Fullstack Developer Bootcamp** program at [harisenin.com](https://harisenin.com).

> 🔄 **This is the Next.js migration** of the original React (Vite) version. See the related repositories below.

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
| Styling          | Tailwind CSS v4 + shadcn/ui                                 |
| State Management | Redux Toolkit + React Redux                                 |
| Database         | PostgreSQL (Neon)                                           |
| ORM / Query      | node-postgres (pg)                                          |
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
- Sort by newest, most liked, or alphabetical
- View all projects on a dedicated page with pagination (3 projects per page)
- Like projects (persisted to database)
- View public user profiles with stats

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
│   │   ├── users/            # Register, login, verify-email, CRUD
│   │   ├── projects/         # GET (filter/sort/search/pagination), POST, PATCH, DELETE
│   │   ├── bookmarks/        # GET by user, POST, DELETE
│   │   ├── comments/         # GET by project, POST, DELETE
│   │   ├── contact/          # POST send email
│   │   └── uploadthing/      # Uploadthing file handler
│   ├── dashboard/            # Dashboard, New Project, Edit Project
│   ├── projects/             # All Projects, Project Detail
│   ├── u/[author]/           # User Profile
│   ├── bookmarks/            # Bookmarks page
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
│   ├── layout/               # Header, Footer, AuthCard, AvatarDropdown
│   ├── home/                 # Hero, Section, ProjectCard, CategoryCard, TechPill
│   ├── dashboard/            # ProjectForm
│   └── ui/                   # Button, Input, Checkbox, Divider, ConfirmDialog, Skeleton
├── lib/
│   ├── api/                  # Client-side Axios service files
│   ├── services/             # Server-side DB service files
│   ├── middleware/           # JWT auth middleware for API routes
│   ├── data/                 # Static seed data (categories, technologies)
│   ├── db.ts                 # PostgreSQL pool (Neon)
│   ├── auth.ts               # JWT sign/verify helpers
│   ├── email.ts              # Nodemailer transporter
│   ├── rateLimit.ts          # In-memory rate limiting middleware
│   └── uploadthing.ts        # Uploadthing config
└── store/
    └── redux/                # Redux store, slices (projects, auth, bookmarks, comments)
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
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
NEXT_PUBLIC_REAL_API_BASE_URL=/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

> 💡 Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth client ID (Web application). Set authorized JS origin to `http://localhost:3000` and redirect URI to `http://localhost:3000/api/auth/callback/google`. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

See `.env.example` for reference.

### Database Setup

Run the SQL setup script in your Neon SQL Editor to create all required tables and seed data. The schema includes: `users`, `projects`, `categories`, `technologies`, `project_technologies`, `bookmarks`, `comments`.

### Running Locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## API Endpoints

| Method | Endpoint                         | Auth | Description                           |
| ------ | -------------------------------- | ---- | ------------------------------------- |
| GET    | `/api/users`                     | —    | Get all users                         |
| POST   | `/api/users`                     | —    | Register                              |
| POST   | `/api/users/login`               | —    | Login                                 |
| GET    | `/api/users/verify-email?token=` | —    | Verify email                          |
| GET    | `/api/users/:id`                 | —    | Get user by ID                        |
| PATCH  | `/api/users/:id`                 | ✅   | Update user                           |
| DELETE | `/api/users/:id`                 | ✅   | Delete user                           |
| GET    | `/api/projects`                  | —    | Get all projects (filter/sort/search) |
| POST   | `/api/projects`                  | ✅   | Create project                        |
| GET    | `/api/projects/:id`              | —    | Get project by ID                     |
| PATCH  | `/api/projects/:id`              | ✅   | Update project                        |
| DELETE | `/api/projects/:id`              | ✅   | Delete project                        |
| GET    | `/api/bookmarks?userId=`         | —    | Get bookmarks by user                 |
| POST   | `/api/bookmarks`                 | ✅   | Add bookmark                          |
| DELETE | `/api/bookmarks/:id`             | ✅   | Remove bookmark                       |
| GET    | `/api/comments?projectId=`       | —    | Get comments by project               |
| POST   | `/api/comments`                  | ✅   | Add comment                           |
| DELETE | `/api/comments/:id`              | ✅   | Delete comment                        |
| POST   | `/api/contact`                   | —    | Send contact email                    |
| GET    | `/api/auth/[...nextauth]`        | —    | NextAuth Google OAuth handler         |
| POST   | `/api/auth/exchange`             | —    | Exchange NextAuth session → app JWT cookie |

---

## Known Limitations

- **Comments and bookmarks reference MockAPI project IDs** in the Vite version — fully migrated to real PostgreSQL UUIDs in this Next.js version.
- **Prisma ORM** not yet integrated — currently uses raw `pg` queries.

---

## Planned Improvements

- [ ] Prisma ORM migration from raw pg queries
- [ ] AI features — project description generator, README generator, idea generator (Groq API + Llama)
- [ ] Public API documentation page
- [ ] Deployment to Vercel with environment variable configuration

---

## Developer

**Kresna Satya Nugroho**
GitHub: [@kisnak21](https://github.com/kisnak21)

---

## References

- [Next.js](https://nextjs.org) — full-stack React framework
- [Neon](https://neon.tech) — serverless PostgreSQL
- [shadcn/ui](https://ui.shadcn.com) — component library
- [Redux Toolkit](https://redux-toolkit.js.org) — state management
- [Uploadthing](https://uploadthing.com) — file uploads for Next.js
- [DiceBear](https://www.dicebear.com) — pixel-art avatar generation
- [Mailtrap](https://mailtrap.io) — email testing
- [Dev.to](https://dev.to) — card design inspiration
- [Product Hunt](https://www.producthunt.com) — layout inspiration
- [GitHub Explore](https://github.com/explore) — project card aesthetic
