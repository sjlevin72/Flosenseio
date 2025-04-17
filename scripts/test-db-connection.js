// @ts-check
// Test script for Neon PostgreSQL connection
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const result = dotenv.config({ path: resolve(__dirname, '../.env') });
console.log('Loaded .env file:', result.parsed ? 'Yes' : 'No');

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Get the database URL
    const dbUrl = process.env.PRODUCTION_DATABASE_URL;
    console.log('Production Database URL available:', !!dbUrl);
    
    if (!dbUrl) {
      throw new Error('No database URL provided. Please set PRODUCTION_DATABASE_URL environment variable.');
    }
    
    // Print a masked version of the connection string for debugging
    const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('Using connection string:', maskedUrl);
    
    // Create a Neon client
    const sql = neon(dbUrl);
    
    // Test a simple query
    console.log('Executing test query...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Database connection successful!');
    console.log('Current time from database:', result[0].current_time);
    
    // Try to query water_readings table
    console.log('\nQuerying water_readings table...');
    const readings = await sql`SELECT COUNT(*) as count FROM water_readings`;
    console.log('Water readings count:', readings[0].count);
    
    if (readings[0].count > 0) {
      console.log('\nFetching sample readings...');
      const sampleReadings = await sql`SELECT * FROM water_readings LIMIT 3`;
      console.log('Sample readings:', JSON.stringify(sampleReadings, null, 2));
    } else {
      console.log('\nNo water readings found in the database.');
      console.log('This could indicate that:');
      console.log('1. The database is empty');
      console.log('2. The water_readings table doesn\'t exist');
      console.log('3. There\'s a permission issue');
      
      // Check if the table exists
      console.log('\nChecking if water_readings table exists...');
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'water_readings'
        ) as exists
      `;
      console.log('water_readings table exists:', tableCheck[0].exists);
      
      // List all tables
      console.log('\nListing all tables in the database:');
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      console.log('Tables:', tables.map(t => t.table_name));
    }
    
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();
