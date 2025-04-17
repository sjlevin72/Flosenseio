const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Get the Neon database URL
const NEON_DB_URL = process.env.PRODUCTION_DATABASE_URL;

if (!NEON_DB_URL) {
  console.error('PRODUCTION_DATABASE_URL must be set in .env file');
  process.exit(1);
}

// Connect to the Neon database
const client = new Client({
  connectionString: NEON_DB_URL,
});

// Generate sample water data
function generateSampleWaterData() {
  console.log('Generating sample water data...');
  
  const fixtures = [
    { name: 'shower', flow: [6000, 12000], typical: [6, 8, 19, 21] }, // ml/min, morning/evening
    { name: 'toilet', flow: [4000, 7000], typical: [0, 23] }, // any hour
    { name: 'kitchen_sink', flow: [1000, 4000], typical: [7, 9, 12, 14, 18, 20] },
    { name: 'washing_machine', flow: [10000, 15000], typical: [10, 16, 20] },
    { name: 'dishwasher', flow: [8000, 12000], typical: [13, 21] },
    { name: 'bath', flow: [8000, 15000], typical: [20] },
    { name: 'garden_hose', flow: [8000, 20000], typical: [7, 18] },
    { name: 'none', flow: [0, 0], typical: [] }, // for no use
  ];

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setMonth(startDate.getMonth() - 1); // previous month
  startDate.setDate(1);

  // Generate for 31 days, but with fewer intervals for faster processing
  const intervals = 31 * 24 * 12; // 31 days, 5-minute intervals
  
  const waterReadings = [];
  
  for (let i = 0; i < intervals; i++) {
    const timestamp = new Date(startDate.getTime() + i * 300000); // 5 minutes in ms
    const hour = timestamp.getHours();
    
    // Simulate probability of fixture use by time of day
    let fixture = fixtures[fixtures.length - 1]; // default to none
    const rand = Math.random();
    if (hour >= 6 && hour <= 8 && rand < 0.09) fixture = fixtures[0]; // shower
    else if (rand < 0.05) fixture = fixtures[1]; // toilet
    else if ((hour >= 7 && hour <= 9 || hour >= 18 && hour <= 20) && rand < 0.04) fixture = fixtures[2]; // kitchen_sink
    else if ((hour === 10 || hour === 16 || hour === 20) && rand < 0.02) fixture = fixtures[3]; // washing_machine
    else if ((hour === 13 || hour === 21) && rand < 0.01) fixture = fixtures[4]; // dishwasher
    else if (hour === 20 && rand < 0.01) fixture = fixtures[5]; // bath
    else if ((hour === 7 || hour === 18) && rand < 0.01) fixture = fixtures[6]; // garden_hose
    
    // If none, flowrate is 0
    let flowrate = 0;
    if (fixture.name !== 'none') {
      // Random flowrate in range, scaled to 5-minute interval
      flowrate = Math.round((fixture.flow[0] + Math.random() * (fixture.flow[1] - fixture.flow[0])) / 6 * 30);
    }
    
    waterReadings.push({
      timestamp: timestamp.toISOString(),
      value: flowrate,
      category: fixture.name
    });
  }
  
  console.log(`Generated ${waterReadings.length} water readings`);
  return waterReadings;
}

// Process water readings into water events
function processWaterEvents(waterReadings, userId) {
  console.log('Processing water events...');
  
  const events = [];
  let currentEvent = null;
  
  for (let i = 0; i < waterReadings.length; i++) {
    const reading = waterReadings[i];
    
    // Skip readings with no flow
    if (reading.value === 0) {
      if (currentEvent) {
        // End current event
        currentEvent.endTime = new Date(reading.timestamp);
        currentEvent.duration = Math.round((currentEvent.endTime - currentEvent.startTime) / 1000);
        events.push(currentEvent);
        currentEvent = null;
      }
      continue;
    }
    
    // Start new event or continue current event
    if (!currentEvent) {
      currentEvent = {
        userId,
        startTime: new Date(reading.timestamp),
        category: reading.category,
        volume: reading.value,
        peakFlowRate: reading.value,
        flowValues: [reading.value],
        confidence: 80 + Math.floor(Math.random() * 20), // 80-99%
        anomaly: Math.random() < 0.05, // 5% chance of anomaly
      };
    } else {
      // Update current event
      currentEvent.volume += reading.value;
      currentEvent.flowValues.push(reading.value);
      if (reading.value > currentEvent.peakFlowRate) {
        currentEvent.peakFlowRate = reading.value;
      }
    }
  }
  
  // Finalize events
  events.forEach(event => {
    event.avgFlowRate = Math.round(event.flowValues.reduce((a, b) => a + b, 0) / event.flowValues.length);
    event.flowData = JSON.stringify(event.flowValues);
    delete event.flowValues;
    
    // Add anomaly description if anomaly detected
    if (event.anomaly) {
      const anomalyTypes = [
        'Unusual flow pattern detected',
        'Unexpected duration for this category',
        'Flow rate exceeds typical range',
        'Possible leak detected',
        'Unusual time of day for this usage'
      ];
      event.anomalyDescription = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    }
  });
  
  console.log(`Processed ${events.length} water events`);
  return events;
}

// Main function to set up the database
async function setupDatabase() {
  try {
    console.log('Connecting to Neon database...');
    await client.connect();
    console.log('Connected to Neon database');
    
    // Create tables
    console.log('Creating database schema...');
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
    
    // Create a demo user
    console.log('Creating demo user...');
    const username = 'demo_user';
    const password = crypto.createHash('sha256').update('password123').digest('hex');
    
    const userResult = await client.query(
      'INSERT INTO users(username, password) VALUES($1, $2) ON CONFLICT (username) DO UPDATE SET password = $2 RETURNING id',
      [username, password]
    );
    
    const userId = userResult.rows[0].id;
    console.log(`Created/updated demo user with ID: ${userId}`);
    
    // Create settings for the user
    console.log('Creating user settings...');
    await client.query(
      `INSERT INTO settings(user_id, data_retention, store_raw_data, allow_ai_analysis, 
                           share_anonymized_data, share_with_utility, participate_in_community)
       VALUES($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         data_retention = $2,
         store_raw_data = $3,
         allow_ai_analysis = $4,
         share_anonymized_data = $5,
         share_with_utility = $6,
         participate_in_community = $7`,
      [userId, '90', true, true, true, false, false]
    );
    
    // Generate water readings
    const waterReadings = generateSampleWaterData();
    
    // Insert water readings
    console.log('Inserting water readings...');
    for (let i = 0; i < waterReadings.length; i++) {
      const reading = waterReadings[i];
      await client.query(
        'INSERT INTO water_readings(user_id, timestamp, value) VALUES($1, $2, $3)',
        [userId, reading.timestamp, reading.value]
      );
      
      // Log progress every 100 readings
      if ((i + 1) % 100 === 0) {
        console.log(`Inserted ${i + 1}/${waterReadings.length} water readings`);
      }
    }
    
    // Process and insert water events
    console.log('Processing and inserting water events...');
    const waterEvents = processWaterEvents(waterReadings, userId);
    
    for (let i = 0; i < waterEvents.length; i++) {
      const event = waterEvents[i];
      await client.query(
        `INSERT INTO water_events(
          user_id, start_time, end_time, duration_seconds, volume, 
          peak_flow_rate, avg_flow_rate, category, confidence, anomaly, 
          anomaly_description, flow_data
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          event.userId,
          event.startTime,
          event.endTime,
          event.duration,
          event.volume,
          event.peakFlowRate,
          event.avgFlowRate,
          event.category,
          event.confidence,
          event.anomaly,
          event.anomalyDescription || null,
          event.flowData
        ]
      );
      
      // Log progress every 10 events
      if ((i + 1) % 10 === 0) {
        console.log(`Inserted ${i + 1}/${waterEvents.length} water events`);
      }
    }
    
    console.log('Database setup completed successfully!');
    console.log(`\nLogin credentials for the demo user:\nUsername: ${username}\nPassword: password123`);
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the setup
setupDatabase();
