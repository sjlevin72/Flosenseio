import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from "../shared/schema";
import path from 'path';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

neonConfig.webSocketConstructor = ws;

// Log environment variables for debugging
console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (value hidden)' : 'Not set');
console.log('PRODUCTION_DATABASE_URL:', process.env.PRODUCTION_DATABASE_URL ? 'Set (value hidden)' : 'Not set');

// Replace with your production database URL
const DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || "";

if (!DATABASE_URL) {
  console.error("PRODUCTION_DATABASE_URL must be set");
  process.exit(1);
}

async function setupDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log('Setting up database schema...');
    
    // If you have migrations, use this:
    // await migrate(db, { migrationsFolder: path.join(__dirname, '../migrations') });
    
    // Otherwise, create tables directly:
    const { users, settings, waterReadings, waterEvents } = schema;
    
    // Create tables in the correct order
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        data_retention TEXT NOT NULL DEFAULT '90',
        store_raw_data BOOLEAN DEFAULT TRUE,
        allow_ai_analysis BOOLEAN DEFAULT TRUE,
        share_anonymized_data BOOLEAN DEFAULT TRUE,
        share_with_utility BOOLEAN DEFAULT FALSE,
        participate_in_community BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS water_readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        timestamp TIMESTAMP NOT NULL,
        value INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS water_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        duration_seconds INTEGER NOT NULL,
        volume INTEGER NOT NULL,
        peak_flow_rate INTEGER NOT NULL,
        avg_flow_rate INTEGER NOT NULL,
        category TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        anomaly BOOLEAN DEFAULT FALSE,
        anomaly_description TEXT,
        flow_data JSONB NOT NULL
      );
    `);
    
    console.log('Database schema set up successfully!');
  } catch (error) {
    console.error('Error setting up database schema:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);
