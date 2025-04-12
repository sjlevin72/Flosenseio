// Basic water reading from the sensor
export interface WaterReading {
  id: number;
  timestamp: string;
  value: number; // in milliliters
}

// Single water usage event
export interface WaterEvent {
  id: string;
  startTime: string;
  endTime: string;
  duration: string;
  volume: string; // in liters
  flowRate: string; // could be a number or "Varied"
  avgFlowRate: number; // average flow rate in liters/minute
  category: string;
  confidence: number;
  anomaly: boolean;
  anomalyDescription?: string;
  flowData: FlowDataPoint[];
  time?: string; // formatted time for display
}

// For flow profile chart
export interface FlowDataPoint {
  time: string;
  value: number;
}

// For flow event highlighting
export interface FlowEvent {
  id: string;
  startTime: string;
  endTime: string;
  category: string;
  color: string;
}

// Usage category
export interface UsageCategory {
  name: string;
  volume: string;
  percentage: string;
  color?: string;
  icon?: string;
}

// AI recommendation
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: number;
}

// For privacy settings
export interface Settings {
  dataRetention: string;
  storeRawData: boolean;
  allowAiAnalysis: boolean;
  shareAnonymizedData: boolean;
  shareWithUtility: boolean;
  participateInCommunity: boolean;
}

// Complete water usage data
export interface WaterUsageData {
  timeRange: string;
  startDate: string;
  endDate: string;
  totalUsage: string;
  usageComparison: number; // percentage compared to previous period
  peakFlow: string;
  peakFlowTime: string;
  peakFlowCategory?: string;
  eventCount: number;
  categoryCount: number;
  anomalyCount: number;
  anomalyDescription?: string;
  flowData: FlowDataPoint[];
  events: WaterEvent[];
  categories: UsageCategory[];
  recommendations: Recommendation[];
}
