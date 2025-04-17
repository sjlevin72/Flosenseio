// Define the type for water events
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

// Sample water events data
const waterEvents: WaterEvent[] = [
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

// Sample water readings (last 7 days)
let waterReadings: WaterReading[] = [];

// Generate sample water readings for the past 7 days
function generateSampleWaterReadings() {
  const readings: WaterReading[] = [];
  const now = new Date();
  
  // Generate readings for the past 7 days
  for (let i = 0; i < 7; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    
    // Generate readings for each hour of the day
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(day);
      timestamp.setHours(hour, 0, 0, 0);
      
      // Base value between 50-150ml per hour
      let value = 50 + Math.random() * 100;
      
      // Increase usage during morning (6-9 AM) and evening (6-10 PM)
      if (hour >= 6 && hour <= 9) {
        value += 100 + Math.random() * 200; // Morning peak
      } else if (hour >= 18 && hour <= 22) {
        value += 150 + Math.random() * 250; // Evening peak
      }
      
      readings.push({
        id: readings.length + 1,
        timestamp,
        value: Math.round(value)
      });
    }
  }
  
  return readings;
}

// Initialize water readings
waterReadings = generateSampleWaterReadings();

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

// Storage API
export const storage = {
  // Water readings
  getWaterReadings: (startTime?: Date, endTime?: Date) => {
    let filteredReadings = [...waterReadings];
    
    if (startTime) {
      filteredReadings = filteredReadings.filter(r => r.timestamp >= startTime);
    }
    
    if (endTime) {
      filteredReadings = filteredReadings.filter(r => r.timestamp <= endTime);
    }
    
    return filteredReadings;
  },
  
  getWaterReadingsBetween: (startTime: Date, endTime: Date) => {
    return waterReadings.filter(r => 
      r.timestamp >= startTime && r.timestamp <= endTime
    );
  },
  
  addWaterReading: (reading: Omit<WaterReading, 'id'>) => {
    const newReading = {
      id: waterReadings.length + 1,
      ...reading
    };
    waterReadings.push(newReading);
    return newReading;
  },
  
  // Water events
  getActiveWaterEvent: () => {
    return activeWaterEvent;
  },
  
  startWaterEvent: (timestamp: Date) => {
    activeWaterEvent = {
      startTime: timestamp,
      endTime: null,
      volume: 0,
      peakFlowRate: 0,
      avgFlowRate: 0,
      category: "",
      anomaly: false
    };
    return activeWaterEvent;
  },
  
  updateActiveWaterEvent: (timestamp: Date, volume: number) => {
    if (activeWaterEvent) {
      activeWaterEvent.endTime = timestamp;
      activeWaterEvent.volume += volume;
    }
    return activeWaterEvent;
  },
  
  completeWaterEvent: (waterEvent: any) => {
    activeWaterEvent = null;
    return waterEvent;
  },
  
  cancelActiveWaterEvent: () => {
    activeWaterEvent = null;
    return null;
  },
  
  // User settings
  getUserSettings: (userId: number) => {
    return { ...defaultSettings, userId };
  },
  
  createDefaultSettings: (userId: number) => {
    return { ...defaultSettings, userId };
  },
  
  updateUserSettings: (userId: number, settings: Partial<UserSettings>) => {
    return { ...defaultSettings, ...settings, userId };
  },
  
  deleteAllUserData: (userId: number) => {
    // In a real app, this would delete user data
    return true;
  }
};

// Export function to load water events
export function loadWaterEvents(): WaterEvent[] {
  return waterEvents;
}

// Export water events
export { waterEvents };