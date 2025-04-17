require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Log environment variables for debugging
console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (value hidden)' : 'Not set');
console.log('PRODUCTION_DATABASE_URL:', process.env.PRODUCTION_DATABASE_URL ? 'Set (value hidden)' : 'Not set');

// Database URLs
const LOCAL_DB_URL = process.env.DATABASE_URL;
const PRODUCTION_DB_URL = process.env.PRODUCTION_DATABASE_URL;

if (!LOCAL_DB_URL) {
  console.error('LOCAL_DB_URL (DATABASE_URL) not set');
  process.exit(1);
}

if (!PRODUCTION_DB_URL) {
  console.error('PRODUCTION_DB_URL not set');
  process.exit(1);
}

// Function to export data from local database
async function exportData() {
  console.log('Connecting to local database...');
  const client = new Client({
    connectionString: LOCAL_DB_URL
  });

  try {
    await client.connect();
    console.log('Connected to local database');

    // Query data from each table
    console.log('Querying users table...');
    const usersResult = await client.query('SELECT * FROM users');
    
    console.log('Querying settings table...');
    const settingsResult = await client.query('SELECT * FROM settings');
    
    console.log('Querying water_readings table...');
    const waterReadingsResult = await client.query('SELECT * FROM water_readings');
    
    console.log('Querying water_events table...');
    const waterEventsResult = await client.query('SELECT * FROM water_events');

    // Create data export object
    const exportData = {
      users: usersResult.rows,
      settings: settingsResult.rows,
      waterReadings: waterReadingsResult.rows,
      waterEvents: waterEventsResult.rows
    };

    // Save to file
    const exportDir = path.join(__dirname, '../data');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportPath = path.join(exportDir, 'db-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`Data exported successfully to ${exportPath}`);
    
    return exportPath;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Disconnected from local database');
  }
}

// Function to set up schema in production database
async function setupSchema() {
  console.log('Connecting to production database...');
  const client = new Client({
    connectionString: PRODUCTION_DB_URL
  });

  try {
    await client.connect();
    console.log('Connected to production database');

    // Create tables in the correct order
    console.log('Creating tables...');
    await client.query(`
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
        duration_seconds INTEGER,
        volume INTEGER NOT NULL,
        peak_flow_rate INTEGER,
        avg_flow_rate INTEGER,
        category TEXT NOT NULL,
        confidence INTEGER,
        anomaly BOOLEAN DEFAULT FALSE,
        anomaly_description TEXT,
        flow_data JSONB
      );
    `);
    
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error setting up schema:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Disconnected from production database');
  }
}

// Function to import data to production database
async function importData(exportPath) {
  console.log('Connecting to production database...');
  const client = new Client({
    connectionString: PRODUCTION_DB_URL
  });

  try {
    await client.connect();
    console.log('Connected to production database');

    // Read exported data
    if (!exportPath) {
      exportPath = path.join(__dirname, '../data/db-export.json');
    }
    
    if (!fs.existsSync(exportPath)) {
      console.error(`Export file not found: ${exportPath}`);
      process.exit(1);
    }

    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

    // Insert users
    console.log(`Importing ${exportData.users.length} users...`);
    for (const user of exportData.users) {
      await client.query(
        'INSERT INTO users(id, username, password, created_at) VALUES($1, $2, $3, $4) ON CONFLICT (username) DO UPDATE SET password = $3',
        [
          user.id,
          user.username,
          user.password,
          user.created_at || new Date()
        ]
      );
    }

    // Insert settings
    console.log(`Importing ${exportData.settings.length} settings...`);
    for (const setting of exportData.settings) {
      await client.query(
        `INSERT INTO settings(
          id, user_id, data_retention, store_raw_data, allow_ai_analysis, 
          share_anonymized_data, share_with_utility, participate_in_community
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8) 
        ON CONFLICT (id) DO UPDATE SET 
          data_retention = $3, 
          store_raw_data = $4, 
          allow_ai_analysis = $5,
          share_anonymized_data = $6, 
          share_with_utility = $7, 
          participate_in_community = $8`,
        [
          setting.id,
          setting.user_id,
          setting.data_retention,
          setting.store_raw_data,
          setting.allow_ai_analysis,
          setting.share_anonymized_data,
          setting.share_with_utility,
          setting.participate_in_community
        ]
      );
    }

    // Insert water readings
    console.log(`Importing ${exportData.waterReadings.length} water readings...`);
    for (const reading of exportData.waterReadings) {
      await client.query(
        'INSERT INTO water_readings(id, user_id, timestamp, value) VALUES($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [
          reading.id,
          reading.user_id,
          reading.timestamp,
          reading.value
        ]
      );
    }

    // Insert water events
    console.log(`Importing ${exportData.waterEvents.length} water events...`);
    for (const event of exportData.waterEvents) {
      await client.query(
        `INSERT INTO water_events(
          id, user_id, start_time, end_time, duration_seconds, volume, 
          peak_flow_rate, avg_flow_rate, category, confidence, anomaly, 
          anomaly_description, flow_data
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        ON CONFLICT (id) DO NOTHING`,
        [
          event.id,
          event.user_id,
          event.start_time,
          event.end_time,
          event.duration_seconds,
          event.volume,
          event.peak_flow_rate,
          event.avg_flow_rate,
          event.category,
          event.confidence,
          event.anomaly,
          event.anomaly_description,
          event.flow_data
        ]
      );
    }

    console.log('Data imported successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Disconnected from production database');
  }
}

// Main function to run the migration
async function migrateData() {
  try {
    // Step 1: Export data from local database
    const exportPath = await exportData();
    
    // Step 2: Set up schema in production database
    await setupSchema();
    
    // Step 3: Import data to production database
    await importData(exportPath);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateData();
