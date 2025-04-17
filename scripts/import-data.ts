import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema";
import fs from 'fs';
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
const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || "";

if (!PRODUCTION_DATABASE_URL) {
  console.error("PRODUCTION_DATABASE_URL must be set");
  process.exit(1);
}

async function importData() {
  const pool = new Pool({ connectionString: PRODUCTION_DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Read the exported data
    const exportPath = path.join(__dirname, '../data/db-export.json');
    if (!fs.existsSync(exportPath)) {
      console.error('Export file not found. Run export-data.ts first.');
      process.exit(1);
    }

    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

    // Insert data into each table
    // First users
    console.log(`Importing ${exportData.users.length} users...`);
    for (const user of exportData.users) {
      await db.insert(schema.users).values({
        username: user.username,
        password: user.password,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      })
      .onConflictDoUpdate({
        target: schema.users.username,
        set: {
          password: user.password,
        }
      });
    }

    // Then settings
    console.log(`Importing ${exportData.settings.length} settings...`);
    for (const setting of exportData.settings) {
      await db.insert(schema.settings).values({
        userId: setting.userId,
        dataRetention: setting.dataRetention,
        storeRawData: setting.storeRawData,
        allowAiAnalysis: setting.allowAiAnalysis,
        shareAnonymizedData: setting.shareAnonymizedData,
        shareWithUtility: setting.shareWithUtility,
        participateInCommunity: setting.participateInCommunity,
      })
      .onConflictDoUpdate({
        target: [schema.settings.userId],
        set: {
          dataRetention: setting.dataRetention,
          storeRawData: setting.storeRawData,
          allowAiAnalysis: setting.allowAiAnalysis,
          shareAnonymizedData: setting.shareAnonymizedData,
          shareWithUtility: setting.shareWithUtility,
          participateInCommunity: setting.participateInCommunity,
        }
      });
    }

    // Then water readings
    console.log(`Importing ${exportData.waterReadings.length} water readings...`);
    for (const reading of exportData.waterReadings) {
      await db.insert(schema.waterReadings).values({
        userId: reading.userId,
        timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date(),
        value: reading.value,
      })
      .onConflictDoNothing();
    }

    // Finally water events
    console.log(`Importing ${exportData.waterEvents.length} water events...`);
    for (const event of exportData.waterEvents) {
      await db.insert(schema.waterEvents).values({
        userId: event.userId,
        startTime: event.startTime ? new Date(event.startTime) : new Date(),
        endTime: event.endTime ? new Date(event.endTime) : new Date(),
        duration: event.duration,
        volume: event.volume,
        peakFlowRate: event.peakFlowRate,
        avgFlowRate: event.avgFlowRate,
        category: event.category,
        confidence: event.confidence,
        anomaly: event.anomaly,
        anomalyDescription: event.anomalyDescription,
        flowData: event.flowData,
      })
      .onConflictDoNothing();
    }

    console.log('Data imported successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await pool.end();
  }
}

importData().catch(console.error);
