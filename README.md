# Politics Camp Social

Private, invite-only social network for summer politics camp students running for president.

## Features
- Admin-created accounts with roles and tags (BREAKING_NEWS, CANDIDATE, PRESIDENT).
- Feed tabs: Main, Following, Breaking News, Candidates.
- Post composer with text + multiple images/videos (mp4/webm) and previews.
- Follow/unfollow accounts, likes, and profile editing.
- First-run setup screen to create the initial admin.

## Stack
- Next.js App Router + TypeScript + Tailwind
- Prisma + SQLite (dev-ready, switch to Postgres by changing `DATABASE_URL`)
- Session-based auth with secure password hashing (bcrypt)

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
```bash
cp .env.example .env
```

Update values in `.env` as needed:
- `DATABASE_URL`: SQLite for dev (default) or Postgres connection string.
- `SETUP_KEY`: Secret key used to create the first admin.
- `UPLOAD_DIR`: Local uploads directory (default `./public/uploads`).
- `MAX_UPLOAD_MB`: Max file size per upload (server).
- `NEXT_PUBLIC_MAX_UPLOAD_MB`: Same as above for client validation.
- `STORAGE_DRIVER`: `local` for dev. Set to `s3` once you implement a provider.

### 3) Migrate the database
```bash
npm run prisma:migrate
```

### 4) Seed demo data
```bash
npm run prisma:seed
```
Seeded users share password `Password123!` and include an admin, president, candidates, and student users.

### 5) Run the dev server
```bash
npm run dev
```

Visit `http://localhost:3000`.

## First-run admin creation
If the database has no admin, visit `/setup` and enter the `SETUP_KEY` to create the first admin.

## Media storage
Local uploads are stored in `public/uploads` for dev. Production S3 support is stubbed through `STORAGE_DRIVER=s3` in `lib/storage.ts`—replace that with your S3-compatible implementation.

## Commands
- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run start` — start production server
- `npm run prisma:migrate` — run migrations
- `npm run prisma:seed` — seed demo data

