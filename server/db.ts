import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Get the database URL from environment variables
const dbUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("No database URL provided. Please set PRODUCTION_DATABASE_URL or DATABASE_URL environment variable.");
}

// Create a direct HTTP connection for Vercel compatibility
// This bypasses WebSocket which can be problematic in serverless environments
const sql = neon(dbUrl || "");

// Create a Drizzle client
export const db = drizzle(sql, { schema });

// Log connection status
console.log("Database connection initialized with Neon HTTP driver");
console.log("Using database URL:", dbUrl ? "Set" : "Not set");
console.log("Environment:", process.env.NODE_ENV || "development");
