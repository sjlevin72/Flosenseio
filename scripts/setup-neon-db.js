// Setup Neon PostgreSQL database with schema and demo data
const { drizzle } = require('drizzle-orm/neon-serverless');
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { migrate } = require('drizzle-orm/neon-serverless/migrator');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check if we have the required environment variables
if (!process.env.NEON_DATABASE_URL) {
  console.error('Error: NEON_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create a Neon client
const sql = neon(process.env.NEON_DATABASE_URL);
const db = drizzle(sql);

// Import schema
const schema = require('../dist/shared/schema');

async function setupDatabase() {
  try {
    console.log('Setting up Neon PostgreSQL database...');

    // Run migrations
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: path.resolve(__dirname, '../drizzle') });
    
    // Check if demo user exists
    console.log('Checking for existing demo user...');
    const existingUsers = await db.select().from(schema.users).where({ username: 'demo_user' });
    
    if (existingUsers.length === 0) {
      console.log('Creating demo user...');
      
      // Create demo user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const demoUser = await db.insert(schema.users).values({
        username: 'demo_user',
        password: hashedPassword,
        email: 'demo@flosenseio.com',
        createdAt: new Date()
      }).returning();
      
      const userId = demoUser[0].id;
      
      // Create default settings for demo user
      console.log('Creating default settings for demo user...');
      await db.insert(schema.settings).values({
        userId: userId,
        dataRetention: 90,
        shareAnonymousData: true,
        notifications: true,
        theme: 'light',
        participateInCommunity: true
      });
      
      // Generate sample water readings
      console.log('Generating sample water readings...');
      await generateSampleWaterReadings(userId);
      
      // Generate sample water events
      console.log('Generating sample water events...');
      await generateSampleWaterEvents(userId);
      
      console.log('Database setup completed successfully!');
    } else {
      console.log('Demo user already exists, skipping data generation.');
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await sql.end();
  }
}

async function generateSampleWaterReadings(userId) {
  const now = new Date();
  const readings = [];
  
  // Generate readings for the past 7 days
  for (let i = 0; i < 7 * 24 * 12; i++) {
    // Create a reading every 5 minutes
    const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000));
    
    // Base flow with daily patterns
    const hourOfDay = timestamp.getHours();
    let baseFlow = 0;
    
    // Morning peak (6-9 AM)
    if (hourOfDay >= 6 && hourOfDay < 9) {
      baseFlow = 5 + Math.random() * 10;
    } 
    // Evening peak (6-10 PM)
    else if (hourOfDay >= 18 && hourOfDay < 22) {
      baseFlow = 3 + Math.random() * 8;
    }
    // Night (very low usage)
    else if (hourOfDay >= 0 && hourOfDay < 5) {
      baseFlow = Math.random() * 0.5;
    }
    // Regular daytime
    else {
      baseFlow = 1 + Math.random() * 3;
    }
    
    // Add some randomness for realism
    const value = Math.max(0, baseFlow + (Math.random() - 0.5) * 2);
    
    readings.push({
      userId,
      timestamp,
      value: Math.round(value * 10) / 10, // Round to 1 decimal place
    });
  }
  
  // Insert readings in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < readings.length; i += batchSize) {
    const batch = readings.slice(i, i + batchSize);
    await db.insert(schema.waterReadings).values(batch);
  }
  
  console.log(`Generated ${readings.length} sample water readings`);
}

async function generateSampleWaterEvents(userId) {
  const now = new Date();
  const events = [];
  
  // Event categories and their typical durations and volumes
  const eventTypes = [
    { category: 'Shower', duration: [5, 15], volume: [30, 80], anomaly: 0.05 },
    { category: 'Toilet', duration: [0.5, 2], volume: [5, 10], anomaly: 0.02 },
    { category: 'Dishwasher', duration: [30, 60], volume: [15, 25], anomaly: 0.1 },
    { category: 'Washing Machine', duration: [25, 45], volume: [40, 80], anomaly: 0.08 },
    { category: 'Kitchen Sink', duration: [1, 5], volume: [2, 15], anomaly: 0.03 },
    { category: 'Bathroom Sink', duration: [0.5, 3], volume: [1, 8], anomaly: 0.01 },
    { category: 'Garden Watering', duration: [10, 30], volume: [20, 100], anomaly: 0.15 },
  ];
  
  // Generate events for the past 7 days
  for (let day = 0; day < 7; day++) {
    // Number of events per day (between 5 and 15)
    const numEvents = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numEvents; i++) {
      // Random event type
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Random time during the day
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      
      const startTime = new Date(now);
      startTime.setDate(now.getDate() - day);
      startTime.setHours(hour, minute, 0, 0);
      
      // Random duration within the typical range for this event type
      const durationMinutes = eventType.duration[0] + Math.random() * (eventType.duration[1] - eventType.duration[0]);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);
      
      // Random volume within the typical range for this event type
      const volume = Math.round(eventType.volume[0] + Math.random() * (eventType.volume[1] - eventType.volume[0]));
      
      // Determine if this is an anomaly
      const isAnomaly = Math.random() < eventType.anomaly;
      
      events.push({
        userId,
        startTime,
        endTime,
        volume,
        category: eventType.category,
        anomaly: isAnomaly,
        anomalyDescription: isAnomaly ? `Unusual ${eventType.category.toLowerCase()} pattern detected` : null,
        confidence: 0.7 + Math.random() * 0.3, // High confidence (0.7-1.0)
        peakFlowRate: volume / (durationMinutes * 0.3), // Rough estimate
        avgFlowRate: volume / durationMinutes,
      });
    }
  }
  
  // Insert events
  for (const event of events) {
    await db.insert(schema.waterEvents).values(event);
  }
  
  console.log(`Generated ${events.length} sample water events`);
}

// Run the setup
setupDatabase();
