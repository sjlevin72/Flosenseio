import { Client } from 'pg';
import * as schema from "../shared/schema";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Log environment variables for debugging
console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (value hidden)' : 'Not set');
console.log('PRODUCTION_DATABASE_URL:', process.env.PRODUCTION_DATABASE_URL ? 'Set (value hidden)' : 'Not set');

// Replace with your local database URL
const LOCAL_DATABASE_URL = process.env.DATABASE_URL || "";

if (!LOCAL_DATABASE_URL) {
  console.error("DATABASE_URL must be set");
  process.exit(1);
}

async function exportData() {
  const client = new Client({
    connectionString: LOCAL_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to local database');
    
    // Query data directly using SQL
    const usersResult = await client.query('SELECT * FROM users');
    const settingsResult = await client.query('SELECT * FROM settings');
    const waterReadingsResult = await client.query('SELECT * FROM water_readings');
    const waterEventsResult = await client.query('SELECT * FROM water_events');

    // Create data export object
    const exportData = {
      users: usersResult.rows,
      settings: settingsResult.rows,
      waterReadings: waterReadingsResult.rows,
      waterEvents: waterEventsResult.rows,
    };

    // Save to file
    const exportDir = path.join(__dirname, '../data');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(exportDir, 'db-export.json'),
      JSON.stringify(exportData, null, 2)
    );

    console.log('Data exported successfully to data/db-export.json');
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await client.end();
  }
}

exportData().catch(console.error);
