import { drizzle } from "drizzle-orm/postgres-js";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Check for Neon database URL first, fall back to DATABASE_URL for local development
const dbUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "PRODUCTION_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`Using database connection: ${dbUrl.includes('neon') ? 'Neon PostgreSQL' : 'Local PostgreSQL'}`);

export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle(pool, { schema });
