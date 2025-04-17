# Database Migration Scripts

These scripts help you migrate data from your local development database to your production Neon database.

## Prerequisites

1. Node.js and npm installed
2. Access to both your local and production database URLs

## Setup

1. Install dependencies if not already installed:
   ```bash
   npm install @neondatabase/serverless drizzle-orm ws
   ```

2. Create a `.env` file in the project root with your database URLs:
   ```
   DATABASE_URL=your_local_database_url
   PRODUCTION_DATABASE_URL=your_production_database_url
   ```

## Migration Steps

### 1. Export Data from Local Database

This script exports all data from your local database to a JSON file:

```bash
npx tsx scripts/export-data.ts
```

The data will be saved to `data/db-export.json`.

### 2. Set Up Production Database Schema

This script sets up the database schema in your production database:

```bash
npx tsx scripts/setup-db.ts
```

### 3. Import Data to Production Database

This script imports the exported data into your production database:

```bash
npx tsx scripts/import-data.ts
```

## Verifying the Migration

After running these scripts, you can verify the migration by:

1. Checking the logs for any errors
2. Connecting to your production database and querying the tables
3. Testing your application with the new database

## Troubleshooting

- If you encounter connection issues, make sure your database URLs are correct and accessible
- If import fails, check that the schema was created correctly
- For any other issues, check the error logs for details
