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

## Database Management

### Parcels Test Table

The `core.parcels_test` table stores tax sale parcel data for testing and analysis.

#### Create the table:
```bash
node migrate-core-parcels-test.js
```

#### Load data from CSV:
```bash
node load-parcels-test.js
```

This will load 52 rows of tax sale data from `data/conyers_may_2025_sample_56.csv` into the `core.parcels_test` table.

**Table location:** `core.parcels_test`

**Features:**
- 96 TEXT columns for flexible data storage
- Auto-incrementing `id` primary key
- Timestamps (`created_at`, `updated_at`)
- Indexes on `tax_sale_id` and `parcel_id` for faster lookups
