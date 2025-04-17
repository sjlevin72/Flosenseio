// Migrate data from local database to Neon PostgreSQL
const { drizzle } = require('drizzle-orm/neon-serverless');
const { neon } = require('@neondatabase/serverless');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check if we have the required environment variables
if (!process.env.DATABASE_URL || !process.env.NEON_DATABASE_URL) {
  console.error('Error: DATABASE_URL and NEON_DATABASE_URL environment variables are required');
  process.exit(1);
}

// Create database connections
const localPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const neonSql = neon(process.env.NEON_DATABASE_URL);
const neonDb = drizzle(neonSql);

// Import schema
const schema = require('../dist/shared/schema');

async function migrateData() {
  try {
    console.log('Starting migration from local database to Neon...');
    
    // Connect to local database
    const localClient = await localPool.connect();
    console.log('Connected to local database');
    
    // 1. Migrate users
    console.log('Migrating users...');
    const { rows: users } = await localClient.query('SELECT * FROM users');
    
    for (const user of users) {
      // Hash password for security
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Check if user already exists in Neon
      const existingUsers = await neonDb.select().from(schema.users).where({ username: user.username });
      
      if (existingUsers.length === 0) {
        // Insert user into Neon
        await neonDb.insert(schema.users).values({
          username: user.username,
          password: hashedPassword,
          email: user.email || `${user.username}@flosenseio.com`,
          createdAt: user.created_at || new Date()
        });
        
        console.log(`Migrated user: ${user.username}`);
      } else {
        console.log(`User ${user.username} already exists in Neon, skipping...`);
      }
    }
    
    // 2. Migrate settings
    console.log('Migrating settings...');
    const { rows: settings } = await localClient.query('SELECT * FROM settings');
    
    for (const setting of settings) {
      // Find corresponding user in Neon
      const neonUser = await neonDb.select().from(schema.users).where({ username: setting.user_id });
      
      if (neonUser.length > 0) {
        const userId = neonUser[0].id;
        
        // Check if settings already exist
        const existingSettings = await neonDb.select().from(schema.settings).where({ userId });
        
        if (existingSettings.length === 0) {
          // Insert settings into Neon
          await neonDb.insert(schema.settings).values({
            userId,
            dataRetention: setting.data_retention || '90',
            shareAnonymousData: setting.share_anonymized_data || false,
            notifications: true,
            theme: 'light',
            participateInCommunity: setting.participate_in_community || false
          });
          
          console.log(`Migrated settings for user ID: ${userId}`);
        } else {
          console.log(`Settings for user ID ${userId} already exist in Neon, skipping...`);
        }
      }
    }
    
    // 3. Migrate water readings
    console.log('Migrating water readings...');
    const { rows: waterReadings } = await localClient.query('SELECT * FROM water_readings');
    
    // Process in batches to avoid memory issues
    const batchSize = 100;
    let migratedCount = 0;
    
    for (let i = 0; i < waterReadings.length; i += batchSize) {
      const batch = waterReadings.slice(i, Math.min(i + batchSize, waterReadings.length));
      
      for (const reading of batch) {
        // Find corresponding user in Neon
        const neonUser = await neonDb.select().from(schema.users).where({ username: reading.user_id });
        
        if (neonUser.length > 0) {
          const userId = neonUser[0].id;
          
          // Insert reading into Neon
          await neonDb.insert(schema.waterReadings).values({
            userId,
            timestamp: reading.timestamp,
            value: reading.value
          });
          
          migratedCount++;
        }
      }
      
      console.log(`Migrated ${migratedCount}/${waterReadings.length} water readings...`);
    }
    
    // 4. Migrate water events
    console.log('Migrating water events...');
    const { rows: waterEvents } = await localClient.query('SELECT * FROM water_events');
    
    let eventsMigratedCount = 0;
    
    for (const event of waterEvents) {
      // Find corresponding user in Neon
      const neonUser = await neonDb.select().from(schema.users).where({ username: event.user_id });
      
      if (neonUser.length > 0) {
        const userId = neonUser[0].id;
        
        // Insert event into Neon
        await neonDb.insert(schema.waterEvents).values({
          userId,
          startTime: event.start_time,
          endTime: event.end_time,
          volume: event.volume,
          category: event.category,
          anomaly: event.anomaly || false,
          anomalyDescription: event.anomaly_description,
          confidence: event.confidence / 100, // Convert percentage to decimal
          peakFlowRate: event.peak_flow_rate,
          avgFlowRate: event.avg_flow_rate
        });
        
        eventsMigratedCount++;
        
        if (eventsMigratedCount % 10 === 0) {
          console.log(`Migrated ${eventsMigratedCount}/${waterEvents.length} water events...`);
        }
      }
    }
    
    console.log(`Migration completed successfully!`);
    console.log(`Migrated ${users.length} users, ${settings.length} settings, ${migratedCount} water readings, and ${eventsMigratedCount} water events.`);
    
    // Close connections
    await localClient.release();
    await localPool.end();
    await neonSql.end();
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateData();
