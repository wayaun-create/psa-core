# Deployment Configuration

## Structure

This repository now supports dual deployment:

### Vercel (Next.js App)
- **Directory:** `/src`
- **Framework:** Next.js 14 (App Router)
- **Entry:** Next.js automatically detects `/src/app`
- **Build:** `cd src && npm install && npm run build`
- **Output:** `src/.next`

### Render (Express API)
- **Directory:** `/api`
- **Framework:** Express.js
- **Entry:** `api/index.js`
- **Build:** Uses root `package.json`
- **Start:** `npm start` (runs `node api/index.js`)

## What Changed

### 1. Next.js App Structure (/src)
- Created Next.js App Router structure in `/src/app`
- Added `/src/package.json` with Next.js dependencies
- Added `/src/tsconfig.json` for TypeScript support
- Added `/src/next.config.js` for Next.js configuration
- Created health check API route at `/src/app/api/health/route.ts`

### 2. Express API Consolidation (/api)
- Moved Express app from `/src` to `/api`
- `/api/app.js` contains the Express application
- `/api/db.js` contains database connection
- `/api/index.js` is the entry point for Render (starts the server)

### 3. Vercel Configuration
- **vercel.json:**
  - Removed Express rewrite (`/api/* → /api/index.js`)
  - Added Next.js build command pointing to `/src`
  - Set output directory to `src/.next`
  - Kept cache-control headers
  
- **.vercelignore:**
  - Added `/api` to ignore Express API completely
  - Added `/worker` to ignore background worker
  - Added `/public` since Next.js has its own public folder

### 4. Root package.json Updates
- Changed start script to `node api/index.js` (for Render)
- Changed dev script to `nodemon api/index.js`

## Deployment

### Vercel
1. Push to GitHub
2. Vercel will auto-detect Next.js in `/src`
3. Vercel dashboard will show "Framework: Next.js"
4. Health check: `https://your-app.vercel.app/api/health`

### Render
1. Deploy using root directory
2. Start command: `npm start`
3. Runs Express API on `/api` directory
4. Health check: `https://your-api.onrender.com/api/db-test`

## Local Development

### Next.js App
```bash
cd src
npm install
npm run dev
# Opens on http://localhost:3000
```

### Express API
```bash
npm install
npm run dev
# Opens on http://localhost:3000
```

## Key Points

- `/api` directory is completely ignored by Vercel (via .vercelignore)
- `/src` is the Next.js app root with its own package.json
- No Express code runs on Vercel
- No Next.js code runs on Render
- Both deployments are independent and isolated
