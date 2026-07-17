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
| Authentication   | bcrypt + JSON Web Token (JWT)                               |
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
- View all projects on a dedicated page
- Like projects (persisted to database)
- View public user profiles with stats

### Auth

- Register with name, email, password
- Email verification via Nodemailer + Mailtrap
- Login with bcrypt password comparison and JWT token
- Session persisted via localStorage — survives page refresh
- Logout clears session

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
│   │   ├── projects/         # GET (filter/sort/search), POST, PATCH, DELETE
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
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_jwt_secret_key
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
NEXT_PUBLIC_REAL_API_BASE_URL=/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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

---

## Known Limitations

- **No server-side session middleware** — authentication is handled client-side via localStorage + JWT. Server-side protected routes via Next.js `middleware.ts` are planned for a future iteration using cookie-based sessions.
- **No real authorization middleware on all routes** — currently ownership checks are enforced in the UI layer and on specific API routes. A full RBAC system is planned.
- **Comments and bookmarks reference MockAPI project IDs** in the Vite version — fully migrated to real PostgreSQL UUIDs in this Next.js version.

---

## Planned Improvements

- [ ] Server-side session with Next.js middleware and cookie-based JWT
- [ ] Full project ownership enforcement across all API routes
- [ ] Auth.js v5 integration for OAuth (Google login)
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
