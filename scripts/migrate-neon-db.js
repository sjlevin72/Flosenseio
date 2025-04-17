// @ts-check
// Migration script for Neon PostgreSQL database
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import ws from 'ws';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Get the database URL
    const dbUrl = process.env.PRODUCTION_DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('No database URL provided. Please set PRODUCTION_DATABASE_URL environment variable.');
    }
    
    console.log('Database URL found. Connecting to Neon PostgreSQL...');
    
    // Create a Neon client
    const sql = neon(dbUrl);
    const db = drizzle(sql);
    
    console.log('Running migrations...');
    
    // Run migrations
    await migrate(db, { migrationsFolder: resolve(__dirname, '../drizzle') });
    
    console.log('Migrations completed successfully!');
    
    // Verify tables
    console.log('\nVerifying database tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('Tables in the database:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    console.log('\nMigration process completed.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
