import { db } from './db';
import { users, settings, waterReadings, waterEvents } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

// User functions
export async function getUser(username: string) {
  const result = await db.select().from(users).where(eq(users.username, username));
  return result[0] || null;
}

export async function getUserById(userId: number) {
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0] || null;
}

// Settings functions
export async function getUserSettings(userId: number) {
  const result = await db.select().from(settings).where(eq(settings.userId, userId));
  return result[0] || null;
}

// Water readings functions
export async function getWaterReadings(userId: number, startTime?: Date, endTime?: Date) {
  let query = db.select().from(waterReadings).where(eq(waterReadings.userId, userId));
  
  if (startTime) {
    query = query.where(gte(waterReadings.timestamp, startTime));
  }
  
  if (endTime) {
    query = query.where(lte(waterReadings.timestamp, endTime));
  }
  
  return await query.orderBy(waterReadings.timestamp);
}

export async function addWaterReading(userId: number, data: { timestamp: Date, value: number }) {
  const result = await db.insert(waterReadings).values({
    userId,
    timestamp: data.timestamp,
    value: data.value
  }).returning();
  
  return result[0];
}

// Water events functions
export async function getWaterEvents(userId: number, startTime?: Date, endTime?: Date) {
  let query = db.select().from(waterEvents).where(eq(waterEvents.userId, userId));
  
  if (startTime) {
    query = query.where(gte(waterEvents.startTime, startTime));
  }
  
  if (endTime) {
    query = query.where(lte(waterEvents.startTime, endTime));
  }
  
  return await query.orderBy(waterEvents.startTime);
}

export async function addWaterEvent(userId: number, data: {
  startTime: Date,
  endTime: Date,
  duration: number,
  volume: number,
  peakFlowRate: number,
  avgFlowRate: number,
  category: string,
  confidence: number,
  anomaly: boolean,
  anomalyDescription?: string,
  flowData: any
}) {
  const result = await db.insert(waterEvents).values({
    userId,
    startTime: data.startTime,
    endTime: data.endTime,
    duration: data.duration,
    volume: data.volume,
    peakFlowRate: data.peakFlowRate,
    avgFlowRate: data.avgFlowRate,
    category: data.category,
    confidence: data.confidence,
    anomaly: data.anomaly,
    anomalyDescription: data.anomalyDescription,
    flowData: data.flowData
  }).returning();
  
  return result[0];
}

// Format water events for the frontend
export function formatWaterEvent(event: any) {
  return {
    eventNo: event.id,
    startedAt: event.startTime.toLocaleString('en-GB'),
    finishedAt: event.endTime.toLocaleString('en-GB'),
    volume: event.volume / 1000, // Convert to liters
    duration: event.duration,
    category: event.category,
    dayOfWeek: event.startTime.toLocaleDateString('en-GB', { weekday: 'short' })
  };
}

// Get all water events formatted for the frontend
export async function getAllFormattedWaterEvents(userId: number) {
  const events = await getWaterEvents(userId);
  return events.map(formatWaterEvent);
}
