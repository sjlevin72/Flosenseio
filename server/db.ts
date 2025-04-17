import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from 'ws';

// Configure Neon to use WebSockets for serverless environments
neonConfig.webSocketConstructor = ws;

// Check for Neon database URL first, fall back to DATABASE_URL for local development
const dbUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("No database URL provided. Please set PRODUCTION_DATABASE_URL or DATABASE_URL environment variable.");
}

// Create a Neon serverless client
const sql = neon(dbUrl || "");

// Create a Drizzle client
export const db = drizzle(sql, { schema });

// Log connection status
console.log("Database connection initialized with Neon serverless driver");
console.log("Using database URL:", dbUrl ? "Set" : "Not set");
