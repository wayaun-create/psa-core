# PSA Core API

Node.js (Express) API running on Render.
Uses direct PostgreSQL access via `pg`.

- No ORM
- No Prisma
- Schema managed externally (SQL / scripts)

## Endpoints
- GET /
- GET /db-test

## Frontend

A simple web dashboard is available in `/public/index.html` that connects to the API.

### Deploy Frontend to Vercel:
1. Update `API_URL` in `/public/index.html` with your Render API URL
2. Deploy the `/public` folder to Vercel:
   ```bash
   cd public
   vercel
   ```

### Deploy Backend to Render:
1. Connect your GitHub repo to Render
2. Set `DATABASE_URL` environment variable
3. Render will auto-detect `render.yaml`
