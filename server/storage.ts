import { waterReadings, waterEvents, settings, users } from "@shared/schema";
import type { 
  WaterReading, WaterEvent, Settings, User, 
  InsertUser, InsertSettings, InsertWaterReading, InsertWaterEvent 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Water readings
  getWaterReadings(startTime?: Date, endTime?: Date): Promise<WaterReading[]>;
  getWaterReadingsBetween(startTime: Date, endTime: Date): Promise<WaterReading[]>;
  addWaterReading(reading: { timestamp: Date, value: number }): Promise<WaterReading>;
  
  // Water events
  getWaterEvents(startTime?: Date, endTime?: Date, category?: string): Promise<WaterEvent[]>;
  getWaterEvent(id: number): Promise<WaterEvent | undefined>;
  startWaterEvent(timestamp: Date): Promise<{ id: number, startTime: Date }>;
  getActiveWaterEvent(): Promise<{ id: number, startTime: Date } | undefined>;
  updateActiveWaterEvent(timestamp: Date, value: number): Promise<void>;
  completeWaterEvent(event: Omit<WaterEvent, "id">): Promise<WaterEvent>;
  cancelActiveWaterEvent(): Promise<void>;
  updateWaterEventCategory(id: number, category: string): Promise<WaterEvent | undefined>;
  flagWaterEvent(id: number, isAnomaly: boolean, reason?: string): Promise<WaterEvent | undefined>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string, password: string }): Promise<User>;
  
  // Settings
  getUserSettings(userId: number): Promise<Settings | undefined>;
  updateUserSettings(userId: number, newSettings: Partial<Settings>): Promise<Settings>;
  createDefaultSettings(userId: number): Promise<Settings>;
  
  // Data management
  deleteAllUserData(userId: number): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private readings: Map<number, WaterReading>;
  private events: Map<number, WaterEvent>;
  private settings: Map<number, Settings>;
  private activeEvent: { id: number, startTime: Date } | null;
  private currentIds: {
    user: number;
    reading: number;
    event: number;
    setting: number;
  };

  constructor() {
    this.users = new Map();
    this.readings = new Map();
    this.events = new Map();
    this.settings = new Map();
    this.activeEvent = null;
    this.currentIds = {
      user: 1,
      reading: 1,
      event: 1,
      setting: 1,
    };
    
    // Add sample user
    this.createUser({ username: "johnsmith", password: "password123" });
  }

  // WATER READINGS
  // =========================================================================
  
  async getWaterReadings(startTime?: Date, endTime?: Date): Promise<WaterReading[]> {
    let readings = Array.from(this.readings.values());
    
    if (startTime) {
      readings = readings.filter(reading => 
        new Date(reading.timestamp) >= startTime
      );
    }
    
    if (endTime) {
      readings = readings.filter(reading => 
        new Date(reading.timestamp) <= endTime
      );
    }
    
    // Sort by timestamp ascending
    return readings.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
  
  async getWaterReadingsBetween(startTime: Date, endTime: Date): Promise<WaterReading[]> {
    return this.getWaterReadings(startTime, endTime);
  }
  
  async addWaterReading(reading: { timestamp: Date, value: number }): Promise<WaterReading> {
    const id = this.currentIds.reading++;
    const newReading = {
      id,
      userId: 1, // Default user ID
      timestamp: reading.timestamp,
      value: reading.value
    };
    
    this.readings.set(id, newReading);
    return newReading;
  }
  
  // WATER EVENTS
  // =========================================================================
  
  async getWaterEvents(startTime?: Date, endTime?: Date, category?: string): Promise<WaterEvent[]> {
    let events = Array.from(this.events.values());
    
    if (startTime) {
      events = events.filter(event => 
        new Date(event.startTime) >= startTime
      );
    }
    
    if (endTime) {
      events = events.filter(event => 
        new Date(event.endTime) <= endTime
      );
    }
    
    if (category) {
      events = events.filter(event => event.category === category);
    }
    
    // Sort by start time descending (newest first)
    return events.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }
  
  async getWaterEvent(id: number): Promise<WaterEvent | undefined> {
    return this.events.get(id);
  }
  
  async startWaterEvent(timestamp: Date): Promise<{ id: number, startTime: Date }> {
    const id = this.currentIds.event;
    this.activeEvent = { id, startTime: timestamp };
    return this.activeEvent;
  }
  
  async getActiveWaterEvent(): Promise<{ id: number, startTime: Date } | undefined> {
    return this.activeEvent || undefined;
  }
  
  async updateActiveWaterEvent(timestamp: Date, value: number): Promise<void> {
    // No update needed for in-memory implementation
    // This would be used in a DB implementation to update timestamps
  }
  
  async completeWaterEvent(event: Omit<WaterEvent, "id">): Promise<WaterEvent> {
    if (!this.activeEvent) {
      throw new Error("No active water event to complete");
    }
    
    const id = this.activeEvent.id;
    const newEvent: WaterEvent = {
      id,
      ...event
    };
    
    this.events.set(id, newEvent);
    this.currentIds.event++;
    this.activeEvent = null;
    
    return newEvent;
  }
  
  async cancelActiveWaterEvent(): Promise<void> {
    this.activeEvent = null;
  }
  
  async updateWaterEventCategory(id: number, category: string): Promise<WaterEvent | undefined> {
    const event = this.events.get(id);
    
    if (!event) {
      return undefined;
    }
    
    const updatedEvent = {
      ...event,
      category
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async flagWaterEvent(id: number, isAnomaly: boolean, reason?: string): Promise<WaterEvent | undefined> {
    const event = this.events.get(id);
    
    if (!event) {
      return undefined;
    }
    
    const updatedEvent = {
      ...event,
      anomaly: isAnomaly,
      anomalyDescription: reason || event.anomalyDescription
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  // USERS
  // =========================================================================
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username === username
    );
  }
  
  async createUser(userData: { username: string, password: string }): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { id, ...userData };
    this.users.set(id, user);
    return user;
  }
  
  // SETTINGS
  // =========================================================================
  
  async getUserSettings(userId: number): Promise<Settings | undefined> {
    return this.settings.get(userId);
  }
  
  async updateUserSettings(userId: number, newSettings: Partial<Settings>): Promise<Settings> {
    let userSettings = this.settings.get(userId);
    
    if (!userSettings) {
      userSettings = await this.createDefaultSettings(userId);
    }
    
    const updatedSettings = {
      ...userSettings,
      ...newSettings
    };
    
    this.settings.set(userId, updatedSettings);
    return updatedSettings;
  }
  
  async createDefaultSettings(userId: number): Promise<Settings> {
    const id = this.currentIds.setting++;
    const defaultSettings: Settings = {
      id,
      userId,
      dataRetention: "90",
      storeRawData: true,
      allowAiAnalysis: true,
      shareAnonymizedData: true,
      shareWithUtility: false,
      participateInCommunity: false
    };
    
    this.settings.set(userId, defaultSettings);
    return defaultSettings;
  }
  
  // DATA MANAGEMENT
  // =========================================================================
  
  async deleteAllUserData(userId: number): Promise<void> {
    // Delete all readings and events
    // In a real DB implementation, we would filter by user ID
    this.readings.clear();
    this.events.clear();
    
    // Reset settings to default
    await this.createDefaultSettings(userId);
  }
  
  // SEED DATA FOR DEMO
  // =========================================================================
  
  // Helper method to generate sample data for demo/testing
  async seedSampleData(): Promise<void> {
    const now = new Date();
    
    // Generate 7 days of water readings
    for (let day = 6; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        // Create realistic patterns:
        // - Morning peak (6-8 AM): showers, toilet, etc.
        // - Evening peak (6-9 PM): cooking, dishwasher, etc.
        // - Random usage during the day
        // - Minimal usage at night
        
        let baseRate = 0;
        
        if (hour >= 6 && hour <= 8) {
          // Morning peak
          baseRate = 5 + Math.random() * 3;
        } else if (hour >= 18 && hour <= 21) {
          // Evening peak
          baseRate = 4 + Math.random() * 3;
        } else if (hour >= 9 && hour <= 17) {
          // Daytime
          baseRate = 1 + Math.random() * 2;
        } else {
          // Night (minimal)
          baseRate = Math.random() * 0.5;
        }
        
        // Generate readings at 5-minute intervals
        for (let minute = 0; minute < 60; minute += 5) {
          const readingDate = new Date(now);
          readingDate.setDate(now.getDate() - day);
          readingDate.setHours(hour, minute, 0, 0);
          
          // Add noise to the base rate
          const flowRate = baseRate + (Math.random() - 0.5) * 2;
          
          // Convert from L/min to mL per 5-sec interval (divide by 12)
          const value = Math.max(0, Math.round(flowRate * 1000 / 12));
          
          await this.addWaterReading({
            timestamp: readingDate,
            value: value
          });
        }
      }
    }
    
    // Generate some sample events
    const eventTemplates = [
      {
        category: "shower",
        duration: 8 * 60, // 8 minutes
        volume: 62400, // 62.4 L
        avgFlowRate: 7800, // 7.8 L/min
        peakFlowRate: 10500, // 10.5 L/min
        hoursAgo: 4
      },
      {
        category: "faucet",
        duration: 1.8 * 60, // 1.8 minutes
        volume: 5200, // 5.2 L
        avgFlowRate: 2900, // 2.9 L/min
        peakFlowRate: 3500, // 3.5 L/min
        hoursAgo: 6
      },
      {
        category: "dishwasher",
        duration: 54 * 60, // 54 minutes
        volume: 28600, // 28.6 L
        avgFlowRate: 530, // varied, average 0.53 L/min
        peakFlowRate: 5200, // 5.2 L/min
        hoursAgo: 15
      },
      {
        category: "washing_machine",
        duration: 42 * 60, // 42 minutes
        volume: 52800, // 52.8 L
        avgFlowRate: 1257, // varied, average 1.26 L/min
        peakFlowRate: 8600, // 8.6 L/min
        hoursAgo: 28
      }
    ];
    
    for (const template of eventTemplates) {
      const endTime = new Date(now);
      endTime.setHours(now.getHours() - template.hoursAgo);
      
      const startTime = new Date(endTime);
      startTime.setSeconds(startTime.getSeconds() - template.duration);
      
      // Generate flow data points
      const flowData = [];
      const dataPoints = Math.min(50, Math.max(10, Math.floor(template.duration / 30)));
      
      for (let i = 0; i < dataPoints; i++) {
        const pointTime = new Date(startTime);
        pointTime.setSeconds(pointTime.getSeconds() + i * (template.duration / dataPoints));
        
        let value = template.avgFlowRate / 1000; // Base flow rate in L/min
        
        // Add variation
        if (template.category === "dishwasher" || template.category === "washing_machine") {
          // Cycle patterns for appliances
          const cyclePoint = (i / dataPoints) * 2 * Math.PI;
          value = value * (0.5 + Math.sin(cyclePoint) * 0.5) * 3;
        } else {
          // Random variation for manual usage
          value = value * (0.8 + Math.random() * 0.4);
        }
        
        flowData.push({
          time: pointTime.toISOString(),
          value: value // L/min
        });
      }
      
      // Create event
      this.activeEvent = { id: this.currentIds.event, startTime };
      await this.completeWaterEvent({
        startTime,
        endTime,
        duration: template.duration,
        volume: template.volume,
        peakFlowRate: template.peakFlowRate,
        avgFlowRate: template.avgFlowRate,
        category: template.category,
        confidence: 90 + Math.floor(Math.random() * 10),
        anomaly: false,
        flowData
      });
    }
    
    // Add one anomaly event (potential leak)
    const leakEndTime = new Date(now);
    leakEndTime.setHours(now.getHours() - 2);
    
    const leakStartTime = new Date(leakEndTime);
    leakStartTime.setHours(leakStartTime.getHours() - 3);
    
    const leakFlowData = [];
    for (let i = 0; i < 20; i++) {
      const pointTime = new Date(leakStartTime);
      pointTime.setMinutes(pointTime.getMinutes() + i * 9);
      
      leakFlowData.push({
        time: pointTime.toISOString(),
        value: 0.1 + Math.random() * 0.15 // Low but persistent flow
      });
    }
    
    this.activeEvent = { id: this.currentIds.event, startTime: leakStartTime };
    await this.completeWaterEvent({
      startTime: leakStartTime,
      endTime: leakEndTime,
      duration: 3 * 60 * 60, // 3 hours
      volume: 5400, // 5.4 L
      peakFlowRate: 300, // 0.3 L/min
      avgFlowRate: 150, // 0.15 L/min
      category: "other",
      confidence: 70,
      anomaly: true,
      anomalyDescription: "Continuous low flow detected during inactive hours",
      flowData: leakFlowData
    });
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private activeEvent: { id: number; startTime: Date } | null = null;
  private defaultUserId = 1; // Default user ID for demo purposes

  // WATER READINGS
  // =========================================================================
  
  async getWaterReadings(startTime?: Date, endTime?: Date): Promise<WaterReading[]> {
    let query = db.select().from(waterReadings);
    
    if (startTime) {
      query = query.where(gte(waterReadings.timestamp, startTime));
    }
    
    if (endTime) {
      query = query.where(lte(waterReadings.timestamp, endTime));
    }
    
    return await query.orderBy(waterReadings.timestamp);
  }
  
  async getWaterReadingsBetween(startTime: Date, endTime: Date): Promise<WaterReading[]> {
    return await db.select()
      .from(waterReadings)
      .where(
        and(
          gte(waterReadings.timestamp, startTime),
          lte(waterReadings.timestamp, endTime)
        )
      )
      .orderBy(waterReadings.timestamp);
  }
  
  async addWaterReading(reading: { timestamp: Date, value: number }): Promise<WaterReading> {
    const [newReading] = await db.insert(waterReadings)
      .values({
        userId: this.defaultUserId,
        timestamp: reading.timestamp,
        value: reading.value
      })
      .returning();
    
    return newReading;
  }
  
  // WATER EVENTS
  // =========================================================================
  
  async getWaterEvents(startTime?: Date, endTime?: Date, category?: string): Promise<WaterEvent[]> {
    let query = db.select().from(waterEvents);
    
    const conditions = [];
    
    if (startTime) {
      conditions.push(gte(waterEvents.startTime, startTime));
    }
    
    if (endTime) {
      conditions.push(lte(waterEvents.endTime, endTime));
    }
    
    if (category) {
      conditions.push(eq(waterEvents.category, category));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(waterEvents.startTime));
  }
  
  async getWaterEvent(id: number): Promise<WaterEvent | undefined> {
    const [event] = await db.select()
      .from(waterEvents)
      .where(eq(waterEvents.id, id))
      .limit(1);
    
    return event;
  }
  
  async startWaterEvent(timestamp: Date): Promise<{ id: number, startTime: Date }> {
    // For PostgreSQL, we'll store the active event in memory since there's not
    // an easy way to track it in the database without adding an extra table
    this.activeEvent = { id: -1, startTime: timestamp };
    return this.activeEvent;
  }
  
  async getActiveWaterEvent(): Promise<{ id: number, startTime: Date } | undefined> {
    return this.activeEvent || undefined;
  }
  
  async updateActiveWaterEvent(timestamp: Date, value: number): Promise<void> {
    // No operation needed - tracking in memory
  }
  
  async completeWaterEvent(event: Omit<WaterEvent, "id">): Promise<WaterEvent> {
    if (!this.activeEvent) {
      throw new Error("No active water event to complete");
    }
    
    const [newEvent] = await db.insert(waterEvents)
      .values({
        userId: this.defaultUserId,
        ...event
      })
      .returning();
    
    this.activeEvent = null;
    return newEvent;
  }
  
  async cancelActiveWaterEvent(): Promise<void> {
    this.activeEvent = null;
  }
  
  async updateWaterEventCategory(id: number, category: string): Promise<WaterEvent | undefined> {
    const [updatedEvent] = await db.update(waterEvents)
      .set({ category })
      .where(eq(waterEvents.id, id))
      .returning();
    
    return updatedEvent;
  }
  
  async flagWaterEvent(id: number, isAnomaly: boolean, reason?: string): Promise<WaterEvent | undefined> {
    const [updatedEvent] = await db.update(waterEvents)
      .set({ 
        anomaly: isAnomaly,
        anomalyDescription: reason
      })
      .where(eq(waterEvents.id, id))
      .returning();
    
    return updatedEvent;
  }
  
  // USERS
  // =========================================================================
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    return user;
  }
  
  async createUser(userData: { username: string; password: string }): Promise<User> {
    const [user] = await db.insert(users)
      .values(userData)
      .returning();
    
    return user;
  }
  
  // SETTINGS
  // =========================================================================
  
  async getUserSettings(userId: number): Promise<Settings | undefined> {
    const [userSettings] = await db.select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);
    
    return userSettings;
  }
  
  async updateUserSettings(userId: number, newSettings: Partial<Settings>): Promise<Settings> {
    let userSettings = await this.getUserSettings(userId);
    
    if (!userSettings) {
      userSettings = await this.createDefaultSettings(userId);
    }
    
    const [updatedSettings] = await db.update(settings)
      .set(newSettings)
      .where(eq(settings.id, userSettings.id))
      .returning();
    
    return updatedSettings;
  }
  
  async createDefaultSettings(userId: number): Promise<Settings> {
    const defaultSettings: InsertSettings = {
      userId,
      dataRetention: "90",
      storeRawData: true,
      allowAiAnalysis: true,
      shareAnonymizedData: true,
      shareWithUtility: false,
      participateInCommunity: false
    };
    
    const [newSettings] = await db.insert(settings)
      .values(defaultSettings)
      .returning();
    
    return newSettings;
  }
  
  // DATA MANAGEMENT
  // =========================================================================
  
  async deleteAllUserData(userId: number): Promise<void> {
    // Delete all readings and events for user
    await db.delete(waterReadings).where(eq(waterReadings.userId, userId));
    await db.delete(waterEvents).where(eq(waterEvents.userId, userId));
    
    // Reset settings to default
    const userSettings = await this.getUserSettings(userId);
    if (userSettings) {
      await db.delete(settings).where(eq(settings.id, userSettings.id));
    }
    await this.createDefaultSettings(userId);
  }
  
  // SEED DATA
  // =========================================================================
  
  async seedSampleData(): Promise<void> {
    // Create default user if it doesn't exist
    const existingUser = await this.getUserByUsername("johnsmith");
    if (!existingUser) {
      await this.createUser({ 
        username: "johnsmith", 
        password: "password123" 
      });
    }
    
    const now = new Date();
    
    // Check if we already have data
    const existingReadings = await this.getWaterReadings();
    if (existingReadings.length > 0) {
      console.log("Database already contains readings, skipping seed");
      return;
    }
    
    // Same seeding logic as before, but with this.defaultUserId
    // Generate 7 days of water readings
    for (let day = 6; day >= 0; day--) {
      for (let hour = 0; hour < 24; hour++) {
        // Create realistic patterns:
        // - Morning peak (6-8 AM): showers, toilet, etc.
        // - Evening peak (6-9 PM): cooking, dishwasher, etc.
        // - Random usage during the day
        // - Minimal usage at night
        
        let baseRate = 0;
        
        if (hour >= 6 && hour <= 8) {
          // Morning peak
          baseRate = 5 + Math.random() * 3;
        } else if (hour >= 18 && hour <= 21) {
          // Evening peak
          baseRate = 4 + Math.random() * 3;
        } else if (hour >= 9 && hour <= 17) {
          // Daytime
          baseRate = 1 + Math.random() * 2;
        } else {
          // Night (minimal)
          baseRate = Math.random() * 0.5;
        }
        
        // Generate readings at 5-minute intervals
        for (let minute = 0; minute < 60; minute += 5) {
          const readingDate = new Date(now);
          readingDate.setDate(now.getDate() - day);
          readingDate.setHours(hour, minute, 0, 0);
          
          // Add noise to the base rate
          const flowRate = baseRate + (Math.random() - 0.5) * 2;
          
          // Convert from L/min to mL per 5-sec interval (divide by 12)
          const value = Math.max(0, Math.round(flowRate * 1000 / 12));
          
          await this.addWaterReading({
            timestamp: readingDate,
            value: value
          });
        }
      }
    }
    
    // Generate some sample events
    const eventTemplates = [
      {
        category: "shower",
        duration: 8 * 60, // 8 minutes
        volume: 62400, // 62.4 L
        avgFlowRate: 7800, // 7.8 L/min
        peakFlowRate: 10500, // 10.5 L/min
        hoursAgo: 4
      },
      {
        category: "faucet",
        duration: 1.8 * 60, // 1.8 minutes
        volume: 5200, // 5.2 L
        avgFlowRate: 2900, // 2.9 L/min
        peakFlowRate: 3500, // 3.5 L/min
        hoursAgo: 6
      },
      {
        category: "dishwasher",
        duration: 54 * 60, // 54 minutes
        volume: 28600, // 28.6 L
        avgFlowRate: 530, // varied, average 0.53 L/min
        peakFlowRate: 5200, // 5.2 L/min
        hoursAgo: 15
      },
      {
        category: "washing_machine",
        duration: 42 * 60, // 42 minutes
        volume: 52800, // 52.8 L
        avgFlowRate: 1257, // varied, average 1.26 L/min
        peakFlowRate: 8600, // 8.6 L/min
        hoursAgo: 28
      }
    ];
    
    for (const template of eventTemplates) {
      const endTime = new Date(now);
      endTime.setHours(now.getHours() - template.hoursAgo);
      
      const startTime = new Date(endTime);
      startTime.setSeconds(startTime.getSeconds() - template.duration);
      
      // Generate flow data points
      const flowData = [];
      const dataPoints = Math.min(50, Math.max(10, Math.floor(template.duration / 30)));
      
      for (let i = 0; i < dataPoints; i++) {
        const pointTime = new Date(startTime);
        pointTime.setSeconds(pointTime.getSeconds() + i * (template.duration / dataPoints));
        
        let value = template.avgFlowRate / 1000; // Base flow rate in L/min
        
        // Add variation
        if (template.category === "dishwasher" || template.category === "washing_machine") {
          // Cycle patterns for appliances
          const cyclePoint = (i / dataPoints) * 2 * Math.PI;
          value = value * (0.5 + Math.sin(cyclePoint) * 0.5) * 3;
        } else {
          // Random variation for manual usage
          value = value * (0.8 + Math.random() * 0.4);
        }
        
        flowData.push({
          time: pointTime.toISOString(),
          value: value // L/min
        });
      }
      
      // Create event
      this.activeEvent = { id: -1, startTime };
      await this.completeWaterEvent({
        userId: this.defaultUserId,
        startTime,
        endTime,
        duration: template.duration,
        volume: template.volume,
        peakFlowRate: template.peakFlowRate,
        avgFlowRate: template.avgFlowRate,
        category: template.category,
        confidence: 90 + Math.floor(Math.random() * 10),
        anomaly: false,
        flowData
      });
    }
    
    // Add one anomaly event (potential leak)
    const leakEndTime = new Date(now);
    leakEndTime.setHours(now.getHours() - 2);
    
    const leakStartTime = new Date(leakEndTime);
    leakStartTime.setHours(leakStartTime.getHours() - 3);
    
    const leakFlowData = [];
    for (let i = 0; i < 20; i++) {
      const pointTime = new Date(leakStartTime);
      pointTime.setMinutes(pointTime.getMinutes() + i * 9);
      
      leakFlowData.push({
        time: pointTime.toISOString(),
        value: 0.1 + Math.random() * 0.15 // Low but persistent flow
      });
    }
    
    this.activeEvent = { id: -1, startTime: leakStartTime };
    await this.completeWaterEvent({
      userId: this.defaultUserId,
      startTime: leakStartTime,
      endTime: leakEndTime,
      duration: 3 * 60 * 60, // 3 hours
      volume: 5400, // 5.4 L
      peakFlowRate: 300, // 0.3 L/min
      avgFlowRate: 150, // 0.15 L/min
      category: "other",
      confidence: 70,
      anomaly: true,
      anomalyDescription: "Continuous low flow detected during inactive hours",
      flowData: leakFlowData
    });
  }
}

// Initialize database storage
export const storage = new DatabaseStorage();

// Seed sample data for demonstration
(async () => {
  try {
    await storage.seedSampleData();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
})();
