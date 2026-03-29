# Vercel + GitHub Push Guide

## Files used by Vercel
- `api/login.js`
- `api/logout.js`
- `api/session.js`
- `api/site-data.js`
- `api/upload.js`
- `lib/server-utils.js`
- `shared-api.js`
- `.env.example`
- `vercel.json`

## What changed
- Public pages load content from `/api/site-data`.
- Admin login uses `/api/login` and `/api/session`.
- Admin saves go to `/api/site-data`.
- Image uploads post to `/api/upload`.
- Site data persistence uses Supabase Storage.
- Image uploads use Supabase Storage.
- Browser `localStorage` is only a limited fallback for local/offline preview behavior.

## Required Vercel environment variables
Set these in Vercel Project Settings → Environment Variables:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `SITE_DATA_STORAGE_PATH`

## Recommended values
- `SUPABASE_STORAGE_BUCKET=SITE-MEDIA`
- `SITE_DATA_STORAGE_PATH=site/powers-data.json`

## VS Code terminal prompts / commands

### 1) Open repo in VS Code
```bash
code .
```

### 2) Initialize git if needed
```bash
git init
git branch -M main
```

### 3) Install dependencies
```bash
npm install
```

### 4) Verify JavaScript syntax
```bash
npm run check:js
```

### 5) Commit everything
```bash
git add .
git commit -m "Supabase-backed admin/content persistence and uploads"
```

### 6) Create GitHub repo and push
```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### 7) Import to Vercel
- Go to Vercel dashboard
- Import the GitHub repository
- Set the project root to `powersproperties-main`
- Add the environment variables from `.env.example`
- Deploy

## Local notes
- Static browser preview can still work with local fallback behavior.
- Real shared persistence and shared uploads require deployed API routes plus Supabase configuration.

## Important
- Do not place real secrets in `.env.example`; only placeholders belong there.
