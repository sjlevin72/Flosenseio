// Define the type for water events
import { db } from './db';
import { waterEvents as waterEventsTable, waterReadings as waterReadingsTable, settings as settingsTable } from "@shared/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

interface WaterEvent {
  eventNo: number;
  startedAt: string;
  finishedAt: string;
  volume: number;
  duration: number;
  category: string;
  dayOfWeek: string;
}

// Define the type for water readings
interface WaterReading {
  id?: number;
  timestamp: Date;
  value: number;
  userId?: number;
}

// Define the type for user settings
interface UserSettings {
  userId: number;
  dataRetention: string;
  storeRawData: boolean;
  allowAiAnalysis: boolean;
  shareAnonymizedData: boolean;
  shareWithUtility: boolean;
  participateInCommunity: boolean;
}

// In-memory storage for active water events
let activeWaterEvent: any = null;

// Sample water events data (fallback if database is not available)
const sampleWaterEvents: WaterEvent[] = [
  {
    eventNo: 13452,
    startedAt: '17/04/2025, 07:30:00',
    finishedAt: '17/04/2025, 07:35:00',
    volume: 45.2,
    duration: 300,
    category: 'ShowerBath',
    dayOfWeek: 'Thu'
  },
  {
    eventNo: 13451,
    startedAt: '17/04/2025, 06:45:00',
    finishedAt: '17/04/2025, 06:46:00',
    volume: 6.0,
    duration: 60,
    category: 'ToiletFlush',
    dayOfWeek: 'Thu'
  },
  {
    eventNo: 13450,
    startedAt: '16/04/2025, 19:15:00',
    finishedAt: '16/04/2025, 19:16:00',
    volume: 5.8,
    duration: 60,
    category: 'ToiletFlush',
    dayOfWeek: 'Wed'
  },
  {
    eventNo: 13449,
    startedAt: '16/04/2025, 18:30:00',
    finishedAt: '16/04/2025, 19:30:00',
    volume: 65.3,
    duration: 3600,
    category: 'Dishwasher',
    dayOfWeek: 'Wed'
  },
  {
    eventNo: 13448,
    startedAt: '16/04/2025, 12:15:00',
    finishedAt: '16/04/2025, 12:17:00',
    volume: 3.5,
    duration: 120,
    category: 'Faucet',
    dayOfWeek: 'Wed'
  },
  {
    eventNo: 13447,
    startedAt: '15/04/2025, 07:45:00',
    finishedAt: '15/04/2025, 07:50:00',
    volume: 42.8,
    duration: 300,
    category: 'ShowerBath',
    dayOfWeek: 'Tue'
  },
  {
    eventNo: 13446,
    startedAt: '15/04/2025, 06:30:00',
    finishedAt: '15/04/2025, 06:31:00',
    volume: 6.1,
    duration: 60,
    category: 'ToiletFlush',
    dayOfWeek: 'Tue'
  },
  {
    eventNo: 13445,
    startedAt: '14/04/2025, 19:00:00',
    finishedAt: '14/04/2025, 20:00:00',
    volume: 75.2,
    duration: 3600,
    category: 'WashingMachine',
    dayOfWeek: 'Mon'
  },
  {
    eventNo: 13444,
    startedAt: '14/04/2025, 07:30:00',
    finishedAt: '14/04/2025, 07:35:00',
    volume: 44.3,
    duration: 300,
    category: 'ShowerBath',
    dayOfWeek: 'Mon'
  },
  {
    eventNo: 13443,
    startedAt: '13/04/2025, 11:45:00',
    finishedAt: '13/04/2025, 11:47:00',
    volume: 4.2,
    duration: 120,
    category: 'Faucet',
    dayOfWeek: 'Sun'
  }
];

// Default user settings
const defaultSettings: UserSettings = {
  userId: 1,
  dataRetention: '90',
  storeRawData: true,
  allowAiAnalysis: true,
  shareAnonymizedData: true,
  shareWithUtility: false,
  participateInCommunity: false
};

// Helper function to format date to UK format
function formatDateToUK(date: Date): string {
  return date.toLocaleString('en-GB', { timeZone: 'Europe/London' });
}

// Helper function to get day of week
function getDayOfWeek(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short' });
}

// Storage API
export const storage = {
  // Water readings
  getWaterReadings: async (startTime?: Date, endTime?: Date) => {
    try {
      // Default user ID
      const userId = 1;
      
      let query = db.select().from(waterReadingsTable);
      
      // Apply filters
      const filters = [];
      filters.push(eq(waterReadingsTable.userId, userId));
      
      if (startTime) {
        filters.push(gte(waterReadingsTable.timestamp, startTime));
      }
      
      if (endTime) {
        filters.push(lte(waterReadingsTable.timestamp, endTime));
      }
      
      // Execute query with all filters
      return await query.where(and(...filters));
    } catch (error) {
      console.error('Error fetching water readings:', error);
      
      // Generate sample data as fallback
      return generateSampleWaterReadings(startTime, endTime);
    }
  },
  
  getWaterReadingsBetween: async (startTime: Date, endTime: Date) => {
    try {
      const userId = 1;
      
      return await db.select()
        .from(waterReadingsTable)
        .where(
          and(
            eq(waterReadingsTable.userId, userId),
            gte(waterReadingsTable.timestamp, startTime),
            lte(waterReadingsTable.timestamp, endTime)
          )
        );
    } catch (error) {
      console.error('Error fetching water readings between dates:', error);
      
      // Generate sample data as fallback
      return generateSampleWaterReadings(startTime, endTime);
    }
  },
  
  addWaterReading: async (reading: Omit<WaterReading, 'id'>) => {
    try {
      const userId = 1;
      
      const result = await db.insert(waterReadingsTable).values({
        userId,
        timestamp: reading.timestamp,
        value: reading.value
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error adding water reading:', error);
      
      // Return a mock reading as fallback
      return {
        id: Math.floor(Math.random() * 10000),
        userId: 1,
        timestamp: reading.timestamp,
        value: reading.value
      };
    }
  },
  
  // Water events
  getActiveWaterEvent: async () => {
    try {
      const userId = 1;
      
      const activeEvents = await db.select()
        .from(waterEventsTable)
        .where(
          and(
            eq(waterEventsTable.userId, userId),
            isNull(waterEventsTable.endTime)
          )
        );
      
      return activeEvents.length > 0 ? activeEvents[0] : null;
    } catch (error) {
      console.error('Error fetching active water event:', error);
      return activeWaterEvent;
    }
  },
  
  startWaterEvent: async (timestamp: Date) => {
    try {
      const userId = 1;
      
      const result = await db.insert(waterEventsTable).values({
        userId,
        startTime: timestamp,
        endTime: undefined, // Use undefined instead of null
        volume: 0,
        category: "",
        anomaly: false
      }).returning();
      
      activeWaterEvent = result[0];
      return activeWaterEvent;
    } catch (error) {
      console.error('Error starting water event:', error);
      
      // Create a mock active event as fallback
      activeWaterEvent = {
        id: Math.floor(Math.random() * 10000),
        userId: 1,
        startTime: timestamp,
        endTime: null,
        volume: 0,
        category: "",
        anomaly: false
      };
      
      return activeWaterEvent;
    }
  },
  
  updateActiveWaterEvent: async (timestamp: Date, volume: number) => {
    try {
      if (activeWaterEvent) {
        const result = await db.update(waterEventsTable)
          .set({
            endTime: timestamp,
            volume: activeWaterEvent.volume + volume
          })
          .where(eq(waterEventsTable.id, activeWaterEvent.id))
          .returning();
        
        activeWaterEvent = result[0];
      }
      
      return activeWaterEvent;
    } catch (error) {
      console.error('Error updating active water event:', error);
      
      // Update the mock active event as fallback
      if (activeWaterEvent) {
        activeWaterEvent.endTime = timestamp;
        activeWaterEvent.volume += volume;
      }
      
      return activeWaterEvent;
    }
  },
  
  completeWaterEvent: async (waterEvent: any) => {
    try {
      if (activeWaterEvent) {
        const result = await db.update(waterEventsTable)
          .set(waterEvent)
          .where(eq(waterEventsTable.id, activeWaterEvent.id))
          .returning();
        
        activeWaterEvent = null;
        return result[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error completing water event:', error);
      activeWaterEvent = null;
      return waterEvent;
    }
  },
  
  cancelActiveWaterEvent: async () => {
    try {
      if (activeWaterEvent) {
        await db.delete(waterEventsTable)
          .where(eq(waterEventsTable.id, activeWaterEvent.id));
      }
      
      activeWaterEvent = null;
      return null;
    } catch (error) {
      console.error('Error canceling active water event:', error);
      activeWaterEvent = null;
      return null;
    }
  },
  
  // User settings
  getUserSettings: async (userId: number) => {
    try {
      const settings = await db.select()
        .from(settingsTable)
        .where(eq(settingsTable.userId, userId));
      
      return settings.length > 0 ? settings[0] : null;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return { ...defaultSettings, userId };
    }
  },
  
  createDefaultSettings: async (userId: number) => {
    try {
      const result = await db.insert(settingsTable).values({
        userId,
        dataRetention: '90',
        storeRawData: true,
        allowAiAnalysis: true,
        shareAnonymizedData: true,
        shareWithUtility: false,
        participateInCommunity: false
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating default settings:', error);
      return { ...defaultSettings, userId };
    }
  },
  
  updateUserSettings: async (userId: number, settings: Partial<UserSettings>) => {
    try {
      const result = await db.update(settingsTable)
        .set(settings)
        .where(eq(settingsTable.userId, userId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating user settings:', error);
      return { ...defaultSettings, ...settings, userId };
    }
  },
  
  deleteAllUserData: async (userId: number) => {
    try {
      await db.delete(waterReadingsTable).where(eq(waterReadingsTable.userId, userId));
      await db.delete(waterEventsTable).where(eq(waterEventsTable.userId, userId));
      await db.delete(settingsTable).where(eq(settingsTable.userId, userId));
      
      return true;
    } catch (error) {
      console.error('Error deleting user data:', error);
      return false;
    }
  }
};

// Generate sample water readings for the past 7 days
function generateSampleWaterReadings(startTime?: Date, endTime?: Date) {
  const readings: WaterReading[] = [];
  const now = new Date();
  const start = startTime || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const end = endTime || now;
  
  // Generate readings for each hour between start and end
  for (let time = new Date(start); time <= end; time.setHours(time.getHours() + 1)) {
    const timestamp = new Date(time);
    
    // Base value between 50-150ml per hour
    let value = 50 + Math.random() * 100;
    
    // Increase usage during morning (6-9 AM) and evening (6-10 PM)
    const hour = timestamp.getHours();
    if (hour >= 6 && hour <= 9) {
      value += 100 + Math.random() * 200; // Morning peak
    } else if (hour >= 18 && hour <= 22) {
      value += 150 + Math.random() * 250; // Evening peak
    }
    
    readings.push({
      id: readings.length + 1,
      timestamp,
      value: Math.round(value),
      userId: 1
    });
  }
  
  return readings;
}

// Function to load water events from database
async function loadWaterEventsFromDB(): Promise<WaterEvent[]> {
  try {
    // Default user ID
    const userId = 1;
    
    // Get events from database
    const dbEvents = await db.select().from(waterEventsTable).where(eq(waterEventsTable.userId, userId));
    
    // Format events for frontend
    const formattedEvents = dbEvents.map(event => ({
      eventNo: event.id,
      startedAt: formatDateToUK(event.startTime),
      finishedAt: event.endTime ? formatDateToUK(event.endTime) : '',
      volume: event.volume / 1000, // Convert to liters
      duration: event.duration || 0,
      category: event.category || 'Unknown',
      dayOfWeek: getDayOfWeek(event.startTime)
    }));
    
    console.log(`Loaded ${formattedEvents.length} water events from database`);
    return formattedEvents;
  } catch (error) {
    console.error('Error loading water events from database:', error);
    console.log('Falling back to sample water events');
    return sampleWaterEvents;
  }
}

// Export function to load water events
export async function loadWaterEvents(): Promise<WaterEvent[]> {
  const events = await loadWaterEventsFromDB();
  return events.length > 0 ? events : sampleWaterEvents;
}

// Variable to store cached water events
let waterEvents: WaterEvent[] = [];

// Initialize water events
loadWaterEvents().then(events => {
  waterEvents = events;
  console.log(`Initialized ${waterEvents.length} water events`);
});

// Export water events
export { waterEvents };