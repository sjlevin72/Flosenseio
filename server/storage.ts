import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function unixToUKDateString(unix: number): string {
  const date = new Date(unix * 1000);
  return date.toLocaleString('en-GB', { timeZone: 'Europe/London' });
}

function getDayOfWeek(unix: number): string {
  const date = new Date(unix * 1000);
  return date.toLocaleDateString('en-GB', { weekday: 'short' }); // Returns 'Mon', 'Tue', etc.
}

// Standardize category names to ensure consistency
function standardizeCategory(category: string): string {
  // Convert to lowercase for comparison
  const lowerCategory = (category || '').toLowerCase().trim();
  
  // Map of category standardization
  const categoryMap: Record<string, string> = {
    'toilet': 'ToiletFlush',
    'toiletflush': 'ToiletFlush',
    'toilet_flush': 'ToiletFlush',
    'shower': 'ShowerBath',
    'bath': 'ShowerBath',
    'showerbath': 'ShowerBath',
    'shower_bath': 'ShowerBath',
    'faucet': 'Faucet',
    'tap': 'Faucet',
    'sink': 'Faucet',
    'dishwasher': 'Dishwasher',
    'washing_machine': 'WashingMachine',
    'washingmachine': 'WashingMachine',
    'laundry': 'WashingMachine'
  };
  
  // Return standardized category or capitalize first letter if not in map
  if (categoryMap[lowerCategory]) {
    return categoryMap[lowerCategory];
  }
  
  // If not found in map, capitalize first letter
  if (lowerCategory) {
    return lowerCategory.charAt(0).toUpperCase() + lowerCategory.slice(1);
  }
  
  return 'Other';
}

// Generate random faucet usage data for different days of the week
function generateRandomFaucetEvents(count: number): Array<any> {
  const faucetEvents = [];
  const days = [1, 2, 3, 4, 5, 6, 7]; // Monday to Sunday
  
  for (let i = 0; i < count; i++) {
    // Random day of the week (1-7)
    const dayOfWeek = days[Math.floor(Math.random() * days.length)];
    
    // Random time of day (0-23 hours)
    const hour = Math.floor(Math.random() * 24);
    
    // Random volume between 0.2 and 8 liters
    const volume = +(0.2 + Math.random() * 7.8).toFixed(2);
    
    // Random duration based on volume (roughly 0.1-0.3 liters per second)
    const flowRate = 0.1 + Math.random() * 0.2; // liters per second
    const duration = Math.round(volume / flowRate);
    
    // Create timestamps
    const now = new Date();
    now.setDate(now.getDate() - (now.getDay() + 7 - dayOfWeek) % 7); // Set to the correct day of the week
    now.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    
    const startTimestamp = Math.floor(now.getTime() / 1000);
    const endTimestamp = startTimestamp + duration;
    
    faucetEvents.push({
      'eventNo.': 1000 + i, // Start from 1000 to avoid conflicts
      startedAt: startTimestamp,
      finishedAt: endTimestamp,
      volume: volume,
      duration: duration,
      category: 'Faucet' // Capitalized category
    });
  }
  
  return faucetEvents;
}

// Generate specific Thursday events
function generateThursdayEvents(): Array<any> {
  const thursdayEvents = [];
  const categories = [
    { name: 'ShowerBath', minVolume: 30, maxVolume: 80, minDuration: 300, maxDuration: 600 },
    { name: 'ToiletFlush', volume: 6, minDuration: 20, maxDuration: 40 },
    { name: 'Dishwasher', minVolume: 15, maxVolume: 25, minDuration: 1800, maxDuration: 3600 },
    { name: 'WashingMachine', minVolume: 40, maxVolume: 80, minDuration: 2400, maxDuration: 3600 }
  ];
  
  // Get the most recent Thursday
  const now = new Date();
  const dayOfWeek = 4; // Thursday (0 = Sunday, 1 = Monday, ..., 4 = Thursday)
  const thursday = new Date(now);
  thursday.setDate(now.getDate() - (now.getDay() + 7 - dayOfWeek) % 7);
  
  // Morning routine (6-9 AM)
  let morningTime = new Date(thursday);
  morningTime.setHours(6, 30, 0, 0);
  
  // Toilet flush at 6:30 AM
  let startTimestamp = Math.floor(morningTime.getTime() / 1000);
  let duration = Math.floor(Math.random() * (categories[1].maxDuration - categories[1].minDuration + 1)) + categories[1].minDuration;
  thursdayEvents.push({
    'eventNo.': 2001,
    startedAt: startTimestamp,
    finishedAt: startTimestamp + duration,
    volume: categories[1].volume,
    duration: duration,
    category: categories[1].name
  });
  
  // Shower at 6:35 AM
  morningTime.setHours(6, 35, 0, 0);
  startTimestamp = Math.floor(morningTime.getTime() / 1000);
  duration = Math.floor(Math.random() * (categories[0].maxDuration - categories[0].minDuration + 1)) + categories[0].minDuration;
  const showerVolume = Math.floor(Math.random() * (categories[0].maxVolume - categories[0].minVolume + 1)) + categories[0].minVolume;
  thursdayEvents.push({
    'eventNo.': 2002,
    startedAt: startTimestamp,
    finishedAt: startTimestamp + duration,
    volume: showerVolume,
    duration: duration,
    category: categories[0].name
  });
  
  // Dishwasher at 8:00 AM
  morningTime.setHours(8, 0, 0, 0);
  startTimestamp = Math.floor(morningTime.getTime() / 1000);
  duration = Math.floor(Math.random() * (categories[2].maxDuration - categories[2].minDuration + 1)) + categories[2].minDuration;
  const dishwasherVolume = Math.floor(Math.random() * (categories[2].maxVolume - categories[2].minVolume + 1)) + categories[2].minVolume;
  thursdayEvents.push({
    'eventNo.': 2003,
    startedAt: startTimestamp,
    finishedAt: startTimestamp + duration,
    volume: dishwasherVolume,
    duration: duration,
    category: categories[2].name
  });
  
  // Evening routine
  // Washing machine at 6:00 PM
  let eveningTime = new Date(thursday);
  eveningTime.setHours(18, 0, 0, 0);
  startTimestamp = Math.floor(eveningTime.getTime() / 1000);
  duration = Math.floor(Math.random() * (categories[3].maxDuration - categories[3].minDuration + 1)) + categories[3].minDuration;
  const washingVolume = Math.floor(Math.random() * (categories[3].maxVolume - categories[3].minVolume + 1)) + categories[3].minVolume;
  thursdayEvents.push({
    'eventNo.': 2004,
    startedAt: startTimestamp,
    finishedAt: startTimestamp + duration,
    volume: washingVolume,
    duration: duration,
    category: categories[3].name
  });
  
  // Toilet flush at 9:30 PM
  eveningTime.setHours(21, 30, 0, 0);
  startTimestamp = Math.floor(eveningTime.getTime() / 1000);
  duration = Math.floor(Math.random() * (categories[1].maxDuration - categories[1].minDuration + 1)) + categories[1].minDuration;
  thursdayEvents.push({
    'eventNo.': 2005,
    startedAt: startTimestamp,
    finishedAt: startTimestamp + duration,
    volume: categories[1].volume,
    duration: duration,
    category: categories[1].name
  });
  
  return thursdayEvents;
}

// Generate sample water events for the past week with realistic patterns
function generatePastWeekEvents(): WaterEvent[] {
  const events: WaterEvent[] = [];
  const now = new Date();
  let eventNo = 10000;
  
  // Generate events for the past 7 days
  for (let day = 6; day >= 0; day--) {
    const date = new Date();
    date.setDate(now.getDate() - day);
    
    // Morning shower (higher volume on weekends)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const morningHour = 7 + Math.floor(Math.random() * 2); // 7-8 AM
    const morningShowerVolume = isWeekend ? 80 + Math.random() * 40 : 60 + Math.random() * 30;
    const morningShowerDuration = morningShowerVolume * 12; // approx 12 seconds per liter
    
    const morningDate = new Date(date);
    morningDate.setHours(morningHour, Math.floor(Math.random() * 59), 0, 0);
    const morningEndDate = new Date(morningDate);
    morningEndDate.setMinutes(morningEndDate.getMinutes() + 10);
    
    events.push({
      eventNo: eventNo++,
      startedAt: formatDateForEvent(morningDate),
      finishedAt: formatDateForEvent(morningEndDate),
      volume: morningShowerVolume,
      duration: morningShowerDuration,
      category: 'ShowerBath',
      dayOfWeek: date.toLocaleDateString('en-GB', { weekday: 'short' })
    });
    
    // Toilet flushes (4-6 per day)
    const toiletFlushes = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < toiletFlushes; i++) {
      const hour = 7 + Math.floor(Math.random() * 14); // Between 7 AM and 9 PM
      const minute = Math.floor(Math.random() * 59);
      const volume = 4.5 + Math.random() * 1.5; // 4.5-6 liters per flush
      
      const toiletDate = new Date(date);
      toiletDate.setHours(hour, minute, 0, 0);
      const toiletEndDate = new Date(toiletDate);
      toiletEndDate.setMinutes(toiletEndDate.getMinutes() + 1);
      
      events.push({
        eventNo: eventNo++,
        startedAt: formatDateForEvent(toiletDate),
        finishedAt: formatDateForEvent(toiletEndDate),
        volume: volume,
        duration: 5 + Math.floor(Math.random() * 3), // 5-7 seconds
        category: 'ToiletFlush',
        dayOfWeek: date.toLocaleDateString('en-GB', { weekday: 'short' })
      });
    }
    
    // Washing Machine (twice a week)
    if (day === 1 || day === 5) {
      const washingDate = new Date(date);
      washingDate.setHours(16, Math.floor(Math.random() * 59), 0, 0);
      const washingEndDate = new Date(washingDate);
      washingEndDate.setHours(17, Math.floor(Math.random() * 30), 0, 0);
      
      events.push({
        eventNo: eventNo++,
        startedAt: formatDateForEvent(washingDate),
        finishedAt: formatDateForEvent(washingEndDate),
        volume: 45 + Math.random() * 15, // 45-60 liters
        duration: 2700 + Math.floor(Math.random() * 900), // About 45-60 minutes
        category: 'WashingMachine',
        dayOfWeek: date.toLocaleDateString('en-GB', { weekday: 'short' })
      });
    }
    
    // Dishwasher (every other day)
    if (day % 2 === 0) {
      const dishwasherDate = new Date(date);
      dishwasherDate.setHours(19, Math.floor(Math.random() * 59), 0, 0);
      const dishwasherEndDate = new Date(dishwasherDate);
      dishwasherEndDate.setHours(20, Math.floor(Math.random() * 30), 0, 0);
      
      events.push({
        eventNo: eventNo++,
        startedAt: formatDateForEvent(dishwasherDate),
        finishedAt: formatDateForEvent(dishwasherEndDate),
        volume: 15 + Math.random() * 5, // 15-20 liters
        duration: 3600 + Math.floor(Math.random() * 600), // About an hour
        category: 'Dishwasher',
        dayOfWeek: date.toLocaleDateString('en-GB', { weekday: 'short' })
      });
    }
    
    // Faucet usage (multiple times per day)
    const faucetUses = 8 + Math.floor(Math.random() * 5); // 8-12 times per day
    for (let i = 0; i < faucetUses; i++) {
      const hour = 7 + Math.floor(Math.random() * 14); // Between 7 AM and 9 PM
      const minute = Math.floor(Math.random() * 59);
      const volume = 0.5 + Math.random() * 2.5; // 0.5-3 liters
      const duration = 10 + Math.floor(Math.random() * 50); // 10-60 seconds
      
      const faucetDate = new Date(date);
      faucetDate.setHours(hour, minute, 0, 0);
      const faucetEndDate = new Date(faucetDate);
      faucetEndDate.setMinutes(faucetEndDate.getMinutes() + Math.floor(duration / 60));
      
      events.push({
        eventNo: eventNo++,
        startedAt: formatDateForEvent(faucetDate),
        finishedAt: formatDateForEvent(faucetEndDate),
        volume: volume,
        duration: duration,
        category: 'Faucet',
        dayOfWeek: date.toLocaleDateString('en-GB', { weekday: 'short' })
      });
    }
    
    // Evening shower (occasionally)
    if (Math.random() > 0.7) { // 30% chance of evening shower
      const eveningHour = 20 + Math.floor(Math.random() * 2); // 8-9 PM
      const eveningShowerVolume = 50 + Math.random() * 30;
      const eveningShowerDuration = eveningShowerVolume * 12; // approx 12 seconds per liter
      
      const eveningDate = new Date(date);
      eveningDate.setHours(eveningHour, Math.floor(Math.random() * 59), 0, 0);
      const eveningEndDate = new Date(eveningDate);
      eveningEndDate.setMinutes(eveningEndDate.getMinutes() + 10);
      
      events.push({
        eventNo: eventNo++,
        startedAt: formatDateForEvent(eveningDate),
        finishedAt: formatDateForEvent(eveningEndDate),
        volume: eveningShowerVolume,
        duration: eveningShowerDuration,
        category: 'ShowerBath',
        dayOfWeek: date.toLocaleDateString('en-GB', { weekday: 'short' })
      });
    }
  }
  
  // Sort events by startedAt
  return events.sort((a, b) => {
    const dateA = new Date(a.startedAt).getTime();
    const dateB = new Date(b.startedAt).getTime();
    return dateB - dateA; // Most recent first
  });
}

// Helper function to format dates consistently for events
function formatDateForEvent(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Define the type for water events
interface WaterEvent {
  eventNo: number;
  startedAt: string;
  finishedAt: string;
  volume: number;
  duration: number;
  category: string;
  dayOfWeek: string;
  rawTimestamp?: number;
  source?: string;
}

// Initialize empty array
let waterEvents: WaterEvent[] = [];

// Function to load water events from Excel file
function loadFromExcel(): WaterEvent[] {
  const absPath = path.join(__dirname, '../SampleData.xlsx');
  
  console.log('[storage.ts] Reading:', absPath);
  
  try {
    const workbook = xlsx.readFile(absPath);
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { defval: '' });
    
    // Process existing events from Excel
    const processedEvents = rows.map((row: any) => {
      // Get standardized category
      const category = standardizeCategory(row.category || row.categorisation || row.Category || '');
      
      // Adjust toilet flush volume to exactly 6 liters
      let volume = Number(row.volume);
      if (category === 'ToiletFlush') {
        volume = 6; // Set toilet flush to exactly 6 liters
      }
      
      const startedAt = Number(row.startedAt) || 0;
      
      return {
        eventNo: row['eventNo.'] || 0,
        startedAt: unixToUKDateString(startedAt),
        finishedAt: unixToUKDateString(Number(row.finishedAt) || 0),
        volume: volume,
        duration: Number(row.duration) || 0,
        category: category,
        dayOfWeek: getDayOfWeek(startedAt),
        rawTimestamp: startedAt, // Store raw timestamp for sorting
        source: 'excel' // Mark the source as excel
      };
    });
    
    // Get the unique categories from the Excel file
    const excelCategories = new Set(processedEvents.map(event => event.category));
    console.log('[storage.ts] Excel categories:', Array.from(excelCategories));
    
    // Generate 20 random faucet events
    const faucetEvents = generateRandomFaucetEvents(20).map((event: any) => {
      const startedAt = event.startedAt || 0;
      return {
        eventNo: event['eventNo.'] || 0,
        startedAt: unixToUKDateString(startedAt),
        finishedAt: unixToUKDateString(event.finishedAt || 0),
        volume: event.volume || 0,
        duration: event.duration || 0,
        category: standardizeCategory(event.category || ''),
        dayOfWeek: getDayOfWeek(startedAt),
        rawTimestamp: startedAt,
        source: 'generated' // Mark the source as generated
      };
    });
    
    // Generate Thursday events
    const thursdayEvents = generateThursdayEvents().map((event: any) => {
      const startedAt = event.startedAt || 0;
      return {
        eventNo: event['eventNo.'] || 0,
        startedAt: unixToUKDateString(startedAt),
        finishedAt: unixToUKDateString(event.finishedAt || 0),
        volume: event.volume || 0,
        duration: event.duration || 0,
        category: event.category || '',
        dayOfWeek: getDayOfWeek(startedAt),
        rawTimestamp: startedAt,
        source: 'generated' // Mark the source as generated
      };
    });
    
    // Filter out generated events that have the same category as Excel events
    const filteredFaucetEvents = faucetEvents.filter(event => !excelCategories.has(event.category));
    const filteredThursdayEvents = thursdayEvents.filter(event => !excelCategories.has(event.category));
    
    // Combine all events
    let allEvents = [...processedEvents, ...filteredFaucetEvents, ...filteredThursdayEvents];
    
    // Sort by timestamp in descending order (newest first)
    allEvents.sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));
    
    // Renumber events starting from 13452 and counting down
    let eventNumber = 13452;
    allEvents = allEvents.map(event => {
      const newEvent = { ...event, eventNo: eventNumber-- };
      // Remove the temporary properties using type assertion
      if (newEvent.rawTimestamp !== undefined) {
        (newEvent as any).rawTimestamp = undefined;
      }
      if (newEvent.source !== undefined) {
        (newEvent as any).source = undefined;
      }
      return newEvent;
    });
    
    // Update the waterEvents array
    waterEvents = allEvents;
    
    console.log('[storage.ts] Loaded events:', waterEvents.length);
    
    return waterEvents;
  } catch (err) {
    console.error('[storage.ts] Error:', err);
    return [];
  }
}

// Export water events with sample data for the past week
export function loadWaterEvents(): WaterEvent[] {
  try {
    // First try to load from Excel file
    const excelData = loadFromExcel();
    
    // Generate past week events
    const pastWeekEvents = generatePastWeekEvents();
    
    // Combine Excel data with generated past week events
    // Filter out any Excel events that have the same day as our generated events
    // to avoid duplicates
    const pastWeekDates = new Set(pastWeekEvents.map(e => e.startedAt.split(' ')[0]));
    const filteredExcelData = excelData.filter(e => !pastWeekDates.has(e.startedAt.split(' ')[0]));
    
    return [...pastWeekEvents, ...filteredExcelData];
  } catch (error) {
    console.error('Error loading water events:', error);
    return generatePastWeekEvents(); // Fallback to just the generated data
  }
}

// Load the data initially
loadWaterEvents();

// Export both the array and the reload function
export { waterEvents };