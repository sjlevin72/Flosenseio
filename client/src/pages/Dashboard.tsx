import { useWaterData } from "../hooks/useWaterData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Layer,
} from "recharts";
import React, { useState, useEffect } from "react";
import {
  format,
  subDays,
  subMonths,
  subWeeks,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Droplets,
  Info,
  X,
  AlertTriangle,
  Settings,
  BarChart as BarChartIcon,
  Home as HomeIcon,
  Waves,
  Droplet,
  Container,
  Utensils,
  WashingMachine,
  HelpCircle
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

// Define the type for event items for type safety
interface WaterEventItem {
  eventNo: number;
  startedAt: string;
  finishedAt: string;
  volume: number;
  duration: number;
  category: string;
  dayOfWeek?: string;
}

interface SummaryByCategory {
  [key: string]: {
    count: number;
    totalVolume: number;
    totalDuration: number;
  };
}

// This function is now a fallback if dayOfWeek isn't available
function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { weekday: "short" });
}

// Color mapping for consistent colors per category
const CATEGORY_COLORS: { [key: string]: string } = {
  "ToiletFlush": "#2563eb", // Blue
  "ShowerBath": "#10b981", // Green
  "Faucet": "#f59e42", // Orange
  "Dishwasher": "#e11d48", // Red
  "WashingMachine": "#a855f7", // Purple
  "Other": "#64748b", // Gray
};

// Icon mapping for each water fixture category
const CATEGORY_ICONS: { [key: string]: React.ReactNode } = {
  "ToiletFlush": <Container size={18} />,
  "ShowerBath": <Waves size={18} />,
  "Faucet": <Droplet size={18} />,
  "Dishwasher": <Utensils size={18} />,
  "WashingMachine": <WashingMachine size={18} />,
  "Other": <HelpCircle size={18} />,
};

// Function to standardize category names for display
function formatCategoryName(category: string): string {
  // Map of raw category names to display names
  const categoryDisplayMap: Record<string, string> = {
    "ToiletFlush": "Toilet Flush",
    "ShowerBath": "Shower/Bath",
    "Faucet": "Faucet",
    "Dishwasher": "Dishwasher",
    "WashingMachine": "Washing Machine",
    "Other": "Other",
  };

  return categoryDisplayMap[category] || category;
}

// Function to generate water-saving tips based on usage patterns
function generateWaterSavingTips(
  summaryByCategory: SummaryByCategory,
  totalVolume: number
): { title: string; description: string; category: string }[] {
  const tips: { title: string; description: string; category: string }[] = [];

  // Calculate average daily usage (assuming data is for a week)
  const dailyAverage = totalVolume / 7;

  // Check for high toilet usage
  if (
    summaryByCategory["ToiletFlush"] &&
    summaryByCategory["ToiletFlush"].totalVolume > 0.25 * totalVolume
  ) {
    tips.push({
      title: "Reduce Toilet Flushes",
      description:
        "Consider using dual-flush toilets or flushing only when necessary. Each flush can use several litres of water.",
      category: "ToiletFlush",
    });
  }

  // Check for high shower/bath usage
  if (
    summaryByCategory["ShowerBath"] &&
    summaryByCategory["ShowerBath"].totalVolume > 0.25 * totalVolume
  ) {
    tips.push({
      title: "Shorten Showers",
      description:
        "Try to keep showers under 5 minutes. Consider fitting a water-saving shower head to reduce the number of litres used per minute.",
      category: "ShowerBath",
    });
  }

  // Check for high faucet usage
  if (
    summaryByCategory["Faucet"] &&
    summaryByCategory["Faucet"].totalVolume > 0.2 * totalVolume
  ) {
    tips.push({
      title: "Turn Off the Tap",
      description:
        "Turn off the tap while brushing teeth, fix leaks promptly, and collect cold water while waiting for hot water to use for plants. Every drop saves litres!",
      category: "Faucet",
    });
  }

  // Check for high dishwasher usage
  if (
    summaryByCategory["Dishwasher"] &&
    summaryByCategory["Dishwasher"].totalVolume > 0.15 * totalVolume
  ) {
    tips.push({
      title: "Run Full Loads in Dishwasher",
      description:
        "Always run the dishwasher with a full load. Modern dishwashers are efficient, but running half loads wastes both water and energy. Use the eco mode to save even more litres.",
      category: "Dishwasher",
    });
  }

  // Check for high washing machine usage
  if (
    summaryByCategory["WashingMachine"] &&
    summaryByCategory["WashingMachine"].totalVolume > 0.15 * totalVolume
  ) {
    tips.push({
      title: "Optimise Washing Machine Loads",
      description:
        "Wash clothes only when you have a full load. Use the eco mode and lower temperature settings to save both water and energy. Each wash can use dozens of litres.",
      category: "WashingMachine",
    });
  }

  // Always add a tip about water-efficient appliances
  tips.push({
    title: "Use Appliance Eco Modes Consistently",
    description:
      "Make it a habit to always use eco modes on all appliances. These settings are designed to optimise water and energy usage without compromising performance. Every cycle saves litres over time.",
    category: "Other",
  });

  // Always include the dual-flush toilets recommendation
  tips.push({
    title: "Install Dual-Flush Toilets",
    description:
      "Dual-flush toilets allow you to choose a lower volume flush for liquid waste and a higher volume for solids, saving many litres of water each day. Consider upgrading if your home still uses traditional single-flush toilets.",
    category: "ToiletFlush",
  });

  // Limit to 5 tips maximum
  return tips.slice(0, 5);
}

// Function to generate 24-hour flow profile data
function generate24HourFlowProfile(events: WaterEventItem[]): { time: string; volume: number }[] {
  // Get the current time
  const now = new Date();
  // Get 24 hours ago
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Create bins for every 10 minutes (144 bins for 24 hours)
  const bins: { [key: string]: number } = {};
  
  // Initialize all bins with 0
  for (let i = 0; i < 144; i++) {
    const binTime = new Date(twentyFourHoursAgo.getTime() + i * 10 * 60 * 1000);
    const timeKey = format(binTime, 'HH:mm');
    bins[timeKey] = 0;
  }
  
  // Filter events from the last 24 hours
  const recentEvents = events.filter(event => {
    try {
      const eventDate = parseISO(event.startedAt.replace(' ', 'T'));
      return isAfter(eventDate, twentyFourHoursAgo) && isBefore(eventDate, now);
    } catch (error) {
      return false;
    }
  });
  
  // Aggregate volumes into 10-minute bins
  recentEvents.forEach(event => {
    try {
      const eventDate = parseISO(event.startedAt.replace(' ', 'T'));
      const timeKey = format(eventDate, 'HH:mm');
      
      // Find the closest 10-minute bin
      const minutes = eventDate.getMinutes();
      const roundedMinutes = Math.floor(minutes / 10) * 10;
      const roundedTimeKey = `${format(eventDate, 'HH')}:${roundedMinutes.toString().padStart(2, '0')}`;
      
      // Add the volume to the bin
      bins[roundedTimeKey] = (bins[roundedTimeKey] || 0) + event.volume;
    } catch (error) {
      // Skip events with invalid dates
    }
  });
  
  // Convert bins to array format for the chart
  return Object.entries(bins)
    .map(([time, volume]) => ({ time, volume }))
    .sort((a, b) => {
      // Sort by time
      const [aHour, aMinute] = a.time.split(':').map(Number);
      const [bHour, bMinute] = b.time.split(':').map(Number);
      
      if (aHour !== bHour) {
        return aHour - bHour;
      }
      return aMinute - bMinute;
    });
}

// Function to extract individual water events for the last 24 hours
function getWaterEventsForLast24Hours(events: WaterEventItem[]): {
  id: number;
  category: string;
  startTime: string;
  endTime: string;
  volume: number;
}[] {
  // Get the current time
  const now = new Date();
  // Get 24 hours ago
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Filter events from the last 24 hours
  const recentEvents = events.filter(event => {
    try {
      const eventDate = parseISO(event.startedAt.replace(' ', 'T'));
      return isAfter(eventDate, twentyFourHoursAgo) && isBefore(eventDate, now);
    } catch (error) {
      return false;
    }
  });
  
  // Format events for display
  return recentEvents.map(event => {
    try {
      const startDate = parseISO(event.startedAt.replace(' ', 'T'));
      const endDate = parseISO(event.finishedAt.replace(' ', 'T'));
      
      return {
        id: event.eventNo,
        category: event.category,
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        volume: event.volume
      };
    } catch (error) {
      // Return a default object for events with invalid dates
      return {
        id: event.eventNo,
        category: event.category,
        startTime: '00:00',
        endTime: '00:00',
        volume: event.volume
      };
    }
  });
}

export default function Dashboard() {
  const { waterEvents, isLoading, refetch } = useWaterData();

  // Add property selection state
  const [selectedProperty, setSelectedProperty] = useState("1 Ascott Way");
  const availableProperties = ["1 Ascott Way", "23 Danzinger Ave"];
  
  // Time period state
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month" | "custom">(
    "week"
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subWeeks(new Date(), 1),
    to: new Date(),
  });

  const [isWaterTipsOpen, setIsWaterTipsOpen] = useState(true);

  // Settings panel state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dailyUsageLimit, setDailyUsageLimit] = useState<number>(() => {
    try {
      const savedLimit = localStorage.getItem("dailyWaterUsageLimit");
      return savedLimit ? parseFloat(savedLimit) : 200; // Default 200 litres
    } catch (e) {
      return 200; // Fallback to default
    }
  });
  const [enableEmailAlerts, setEnableEmailAlerts] = useState<boolean>(() => {
    try {
      const savedSetting = localStorage.getItem("enableWaterUsageEmailAlerts");
      return savedSetting ? savedSetting === "true" : false;
    } catch (e) {
      return false; // Fallback to default
    }
  });

  // National average water usage in litres
  const NATIONAL_AVERAGE = {
    daily: 350, // 350 litres per day per household
    weekly: 2450, // 350 * 7 = 2450 litres per week per household
    monthly: 10500, // 350 * 30 = 10500 litres per month per household
  };

  // Comparison chart state
  const [comparisonPeriod, setComparisonPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("dailyWaterUsageLimit", dailyUsageLimit.toString());
    } catch (e) {
      console.error("Failed to save limit to localStorage:", e);
    }
  }, [dailyUsageLimit]);

  useEffect(() => {
    try {
      localStorage.setItem("enableWaterUsageEmailAlerts", enableEmailAlerts.toString());
    } catch (e) {
      console.error("Failed to save email alert setting to localStorage:", e);
    }
  }, [enableEmailAlerts]);

  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
  };

  // Filter water events based on selected property
  const filteredWaterEvents = React.useMemo(() => {
    if (!Array.isArray(waterEvents)) return [];
    
    // Only show data for "1 Ascott Way" - no data for other properties
    if (selectedProperty !== "1 Ascott Way") {
      return [];
    }
    
    return waterEvents;
  }, [waterEvents, selectedProperty]);
  
  // Filter events based on selected time period
  const filteredEvents = React.useMemo(() => {
    if (!Array.isArray(filteredWaterEvents)) return [];
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    switch (timePeriod) {
      case "day":
        startDate = subDays(now, 1);
        break;
      case "week":
        startDate = subWeeks(now, 1);
        break;
      case "month":
        startDate = subMonths(now, 1);
        break;
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          startDate = startOfDay(dateRange.from);
          endDate = endOfDay(dateRange.to);

          console.log("Custom date range:", {
            from: startDate.toISOString(),
            to: endDate.toISOString(),
          });

          return (filteredWaterEvents as WaterEventItem[]).filter((event) => {
            try {
              // Parse the date string from the event
              const eventDateStr = event.startedAt;

              let eventDate: Date;

              if (/^\d+$/.test(eventDateStr)) {
                // It's a Unix timestamp
                eventDate = new Date(parseInt(eventDateStr) * 1000);
              } else {
                // Try parsing as a date string (various formats)
                eventDate = parseISO(eventDateStr);
              }

              // If the date is invalid, log and include the event
              if (isNaN(eventDate.getTime())) {
                console.warn("Invalid date in event:", event);
                return true;
              }

              const isAfterStart = isAfter(eventDate, startDate);
              const isBeforeEnd = isBefore(eventDate, endDate);

              return isAfterStart && isBeforeEnd;
            } catch (error) {
              console.error("Error parsing date:", error, event);
              return true; // Include events with parsing errors
            }
          });
        }

        startDate = subWeeks(now, 1);
        break;
      default:
        startDate = subWeeks(now, 1);
    }

    return (filteredWaterEvents as WaterEventItem[]).filter((event) => {
      try {
        // Parse the date string from the event
        const eventDateStr = event.startedAt;

        let eventDate: Date;

        if (/^\d+$/.test(eventDateStr)) {
          // It's a Unix timestamp
          eventDate = new Date(parseInt(eventDateStr) * 1000);
        } else {
          // Try parsing as a date string (various formats)
          eventDate = parseISO(eventDateStr);
        }

        // If the date is invalid, log and include the event
        if (isNaN(eventDate.getTime())) {
          console.warn("Invalid date in event:", event);
          return true;
        }

        const isAfterStart = isAfter(eventDate, startDate);
        const isBeforeEnd = isBefore(eventDate, endDate);

        return isAfterStart && isBeforeEnd;
      } catch (error) {
        console.error("Error parsing date:", error, event);
        return true; // Include events with parsing errors
      }
    });
  }, [filteredWaterEvents, timePeriod, dateRange]);

  // Prepare summary by category
  const summaryByCategory: SummaryByCategory = {};
  const categories: string[] = [];
  let totalEvents = 0;
  let totalVolume = 0;
  let totalDuration = 0;

  if (Array.isArray(filteredEvents)) {
    for (const event of filteredEvents as WaterEventItem[]) {
      const cat = event.category || "Other";
      if (!summaryByCategory[cat]) {
        summaryByCategory[cat] = { count: 0, totalVolume: 0, totalDuration: 0 };
        categories.push(cat);
      }
      summaryByCategory[cat].count += 1;
      summaryByCategory[cat].totalVolume += event.volume;
      summaryByCategory[cat].totalDuration += event.duration;
      totalEvents += 1;
      totalVolume += event.volume;
      totalDuration += event.duration;
    }
  }

  // Prepare data for chart: days of week x categories
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const stackedData = days.map((day) => {
    const entry: any = { day };
    for (const cat of categories) {
      entry[cat] = 0;
    }
    return entry;
  });

  if (Array.isArray(filteredEvents)) {
    for (const event of filteredEvents as WaterEventItem[]) {
      const cat = event.category || "Other";
      // Use the dayOfWeek property if available, otherwise fall back to calculating it
      const day = event.dayOfWeek || getDayOfWeek(event.startedAt);
      const idx = days.indexOf(day);
      if (idx !== -1) {
        stackedData[idx][cat] += event.volume;
      }
    }
  }

  // Generate water-saving tips based on usage patterns
  const waterSavingTips = generateWaterSavingTips(summaryByCategory, totalVolume);

  // Calculate today's water usage for alert
  const todayUsage = React.useMemo(() => {
    if (!Array.isArray(filteredWaterEvents)) return 0;

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const todayEvents = filteredWaterEvents.filter((event) => {
      try {
        let eventDate: Date;
        try {
          eventDate = parseISO(event.startedAt);
        } catch (e) {
          eventDate = new Date(event.startedAt);
        }

        return isAfter(eventDate, startOfToday) && isBefore(eventDate, endOfToday);
      } catch (error) {
        return false;
      }
    });

    return todayEvents.reduce((sum, event) => sum + event.volume, 0);
  }, [filteredWaterEvents]);

  // Calculate weekly water usage
  const weeklyUsage = React.useMemo(() => {
    if (!Array.isArray(filteredWaterEvents)) return 0;

    const now = new Date();
    const startOfWeek = subDays(now, 7);

    const weekEvents = filteredWaterEvents.filter((event) => {
      try {
        let eventDate: Date;
        try {
          eventDate = parseISO(event.startedAt);
        } catch (e) {
          eventDate = new Date(event.startedAt);
        }

        return isAfter(eventDate, startOfWeek) && isBefore(eventDate, now);
      } catch (error) {
        return false;
      }
    });

    return weekEvents.reduce((sum, event) => sum + event.volume, 0);
  }, [filteredWaterEvents]);

  // Calculate monthly water usage
  const monthlyUsage = React.useMemo(() => {
    if (!Array.isArray(filteredWaterEvents)) return 0;

    const now = new Date();
    const startOfMonth = subDays(now, 30);

    const monthEvents = filteredWaterEvents.filter((event) => {
      try {
        let eventDate: Date;
        try {
          eventDate = parseISO(event.startedAt);
        } catch (e) {
          eventDate = new Date(event.startedAt);
        }

        return isAfter(eventDate, startOfMonth) && isBefore(eventDate, now);
      } catch (error) {
        return false;
      }
    });

    return monthEvents.reduce((sum, event) => sum + event.volume, 0);
  }, [filteredWaterEvents]);

  // Get current usage based on selected comparison period
  const getCurrentUsage = () => {
    switch (comparisonPeriod) {
      case "daily":
        return todayUsage;
      case "weekly":
        return weeklyUsage;
      case "monthly":
        return monthlyUsage;
      default:
        return weeklyUsage;
    }
  };

  // Get national average based on selected comparison period
  const getNationalAverage = () => {
    return NATIONAL_AVERAGE[comparisonPeriod];
  };

  // Prepare comparison data for chart
  const comparisonData = [
    {
      name: "You",
      usage: getCurrentUsage(),
    },
    {
      name: "National Average",
      usage: getNationalAverage(),
    },
  ];

  // Calculate percentage difference from national average
  const percentageDiff = Math.round(
    (getCurrentUsage() / getNationalAverage() - 1) * 100
  );
  const isLowerThanAverage = percentageDiff < 0;

  // Handle saving settings
  const handleSaveSettings = () => {
    setIsSettingsOpen(false);
  };

  // Generate 24-hour flow profile data
  const flowProfileData = React.useMemo(() => {
    if (!Array.isArray(filteredWaterEvents)) return [];
    return generate24HourFlowProfile(filteredWaterEvents);
  }, [filteredWaterEvents]);

  // Get individual water events for the last 24 hours
  const last24HourEvents = React.useMemo(() => {
    if (!Array.isArray(filteredWaterEvents)) return [];
    return getWaterEventsForLast24Hours(filteredWaterEvents);
  }, [filteredWaterEvents]);

  // Custom layer component for event rectangles
  const EventRectanglesLayer = (props: any) => {
    const { events, xScale, yScale, width, height, offset } = props;
  
    if (!xScale || !yScale || !width || !height || !offset) {
      return null;
    }
  
    return (
      <Layer className="event-rectangles-layer">
        {events.map((event: any) => {
          // Convert time strings to minutes since midnight for positioning
          const getMinutesSinceMidnight = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };
          
          const startMinutes = getMinutesSinceMidnight(event.startTime);
          const endMinutes = getMinutesSinceMidnight(event.endTime);
          
          // Handle case where event spans midnight
          const adjustedEndMinutes = endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes;
          
          // Calculate position on x-axis (time)
          const totalMinutesInDay = 24 * 60;
          
          // Convert minutes to time string for xScale
          const startTimeStr = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
          const endTimeStr = `${Math.floor(adjustedEndMinutes / 60).toString().padStart(2, '0')}:${(adjustedEndMinutes % 60).toString().padStart(2, '0')}`;
          
          // Use xScale to get the pixel position
          const startX = xScale(startTimeStr);
          const endX = xScale(endTimeStr);
          
          // If we can't determine the position, skip this event
          if (startX === undefined || endX === undefined) {
            // Try to approximate position based on width
            const startPos = offset.left + (width * startMinutes / totalMinutesInDay);
            const rectWidth = Math.max(
              (width * (adjustedEndMinutes - startMinutes) / totalMinutesInDay),
              2 // Minimum width for visibility
            );
            
            // Get color based on category
            const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other;
            
            // Calculate height based on volume
            const rectHeight = Math.min(
              height * 0.8, // Cap at 80% of chart height
              (event.volume / 80) * height // Scale based on max volume of 80L
            );
            
            return (
              <rect
                key={event.id}
                x={startPos}
                y={offset.top + height - rectHeight}
                width={rectWidth}
                height={rectHeight}
                fill={color}
                fillOpacity={0.3}
                stroke={color}
                strokeOpacity={0.8}
                strokeWidth={1}
                rx={2}
                ry={2}
              />
            );
          }
          
          // Get color based on category
          const color = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other;
          
          // Calculate height based on volume
          const volumeHeight = yScale(event.volume);
          const zeroHeight = yScale(0);
          const rectHeight = Math.min(
            height * 0.8, // Cap at 80% of chart height
            zeroHeight - volumeHeight
          );
          
          return (
            <rect
              key={event.id}
              x={startX}
              y={offset.top + height - rectHeight}
              width={Math.max(endX - startX, 2)} // Ensure minimum width for visibility
              height={rectHeight}
              fill={color}
              fillOpacity={0.3}
              stroke={color}
              strokeOpacity={0.8}
              strokeWidth={1}
              rx={2}
              ry={2}
            />
          );
        })}
      </Layer>
    );
  };

  return (
    <div>
      {/* Property Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HomeIcon className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-2xl font-semibold">
            Water Usage Dashboard
          </h2>
        </div>
        <div className="flex items-center">
          <label htmlFor="property-select" className="mr-2 text-sm font-medium">
            Property:
          </label>
          <select
            id="property-select"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {availableProperties.map((property) => (
              <option key={property} value={property}>
                {property}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* No Data Message for other properties */}
      {selectedProperty !== "1 Ascott Way" && (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200 mb-8">
          <Droplets className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No Water Data Available</h3>
          <p className="text-gray-500">
            There is no water usage data available for {selectedProperty}.
          </p>
          <button
            onClick={() => setSelectedProperty("1 Ascott Way")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            View Data for 1 Ascott Way
          </button>
        </div>
      )}
      
      {/* Only show the dashboard content if we have data */}
      {selectedProperty === "1 Ascott Way" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh}>
                <span>Refresh Data</span>
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {/* Settings Dialog */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Water Use Alert Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Water Usage Alert Settings</DialogTitle>
                    <DialogDescription>
                      Set your daily water usage limit and notification preferences.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dailyLimit" className="col-span-2">
                        Daily Usage Limit (litres)
                      </Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        value={dailyUsageLimit}
                        onChange={(e) => setDailyUsageLimit(Number(e.target.value))}
                        min="1"
                        className="col-span-2"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="emailAlerts" className="col-span-2">
                        Enable Email Alerts
                      </Label>
                      <div className="col-span-2 flex items-center space-x-2">
                        <Switch
                          id="emailAlerts"
                          checked={enableEmailAlerts}
                          onCheckedChange={setEnableEmailAlerts}
                        />
                        <Label htmlFor="emailAlerts">
                          {enableEmailAlerts ? "On" : "Off"}
                        </Label>
                      </div>
                    </div>

                    <div className="col-span-4 mt-2">
                      <div className="text-sm text-gray-500">
                        Current daily usage:{" "}
                        <span className="font-medium">{todayUsage.toFixed(2)} litres</span>
                        {todayUsage > dailyUsageLimit && (
                          <span className="text-red-500 ml-2">(Limit exceeded)</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div
                          className={`h-2.5 rounded-full ${
                            todayUsage > dailyUsageLimit ? "bg-red-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (todayUsage / dailyUsageLimit) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Daily Usage Alert Banner */}
          {todayUsage > dailyUsageLimit && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Daily Water Usage Limit Exceeded</AlertTitle>
              <AlertDescription>
                Your water usage today ({todayUsage.toFixed(2)} litres) has exceeded
                your daily limit of {dailyUsageLimit} litres. Consider reducing your
                water consumption for the rest of the day.
              </AlertDescription>
            </Alert>
          )}

          {/* 24-Hour Flow Profile Chart */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <BarChartIcon className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>Flow Profile (Last 24 Hours)</CardTitle>
                </div>
                <CardDescription>
                  Water usage volume at 10-minute intervals over the past 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={flowProfileData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      {/* Custom layer for event rectangles */}
                      {({ xScale, yScale, width, height, offset }: {
                        xScale: any;
                        yScale: any;
                        width: number;
                        height: number;
                        offset: any;
                      }) => (
                        <EventRectanglesLayer 
                          events={last24HourEvents}
                          xScale={xScale}
                          yScale={yScale}
                          width={width}
                          height={height}
                          offset={offset}
                        />
                      )}
                      
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => time}
                        ticks={['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']}
                      />
                      <YAxis name="Volume (L)" />
                      <Tooltip 
                        formatter={(value, name) => [typeof value === 'number' ? `${value.toFixed(2)} litres` : value, 'Volume']}
                        labelFormatter={(time) => `Time: ${time}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        name="Water Volume (L)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Table */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Summary</h3>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <Select
                  value={timePeriod}
                  onValueChange={(value) =>
                    setTimePeriod(value as "day" | "week" | "month" | "custom")
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Last 24 Hours</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {timePeriod === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 font-medium text-gray-700 border-b">
                <div>Category</div>
                <div className="text-right"># Events</div>
                <div className="text-right">Total Volume (L)</div>
                <div className="text-right">Total Duration (s)</div>
              </div>
              <div className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <div key={cat} className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: CATEGORY_COLORS[cat] || "#64748b" }}
                      ></span>
                      <span className="flex items-center">
                        <span className="mr-2 text-gray-600">{CATEGORY_ICONS[cat]}</span>
                        {formatCategoryName(cat)}
                      </span>
                    </div>
                    <div className="text-right">{summaryByCategory[cat].count}</div>
                    <div className="text-right font-medium">
                      {summaryByCategory[cat].totalVolume.toFixed(2)}
                    </div>
                    <div className="text-right">
                      {summaryByCategory[cat].totalDuration.toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 font-semibold text-gray-800">
                  <div>Total</div>
                  <div className="text-right">{totalEvents}</div>
                  <div className="text-right">{totalVolume.toFixed(2)}</div>
                  <div className="text-right">{totalDuration.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stacked Column Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">Weekly Usage by Category</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis
                  label={{ value: "Volume (L)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value, name) => [typeof value === 'number' ? `${value.toFixed(2)} litres` : value, formatCategoryName(name as string)]}
                />
                <Legend formatter={(value) => formatCategoryName(value)} />
                {categories.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={CATEGORY_COLORS[cat] || "#64748b"}
                    name={cat}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Water Usage Comparison */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Water Usage Comparison</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">View:</span>
                <Select
                  value={comparisonPeriod}
                  onValueChange={(value) =>
                    setComparisonPeriod(value as "daily" | "weekly" | "monthly")
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <BarChartIcon className="h-5 w-5 text-primary mr-2" />
                      <h4 className="text-base font-medium">Your Usage vs. National Average</h4>
                    </div>
                    <div className="text-sm font-medium">
                      {isLowerThanAverage ? (
                        <span className="text-green-600">{Math.abs(percentageDiff)}% below average</span>
                      ) : (
                        <span className="text-red-600">{percentageDiff}% above average</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your {comparisonPeriod} usage</span>
                        <span className="font-medium">{getCurrentUsage().toFixed(2)} litres</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div
                          className="h-2.5 rounded-full bg-primary"
                          style={{
                            width: `${Math.min(
                              100,
                              (getCurrentUsage() / Math.max(getNationalAverage(), getCurrentUsage()) * 100)
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>National average ({comparisonPeriod})</span>
                        <span className="font-medium">{getNationalAverage().toFixed(2)} litres</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-gray-500"
                          style={{
                            width: `${Math.min(
                              100,
                              (getNationalAverage() / Math.max(getNationalAverage(), getCurrentUsage()) * 100)
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: "Volume (L)", angle: -90, position: "insideLeft" }} />
                        <Tooltip formatter={(value) => [typeof value === 'number' ? `${value.toFixed(2)} litres` : value, "Usage"]} />
                        <Bar dataKey="usage" name="Water Usage">
                          {comparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : "#64748b"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Water-Saving Tips Panel */}
          <div className="mb-8">
            <Collapsible
              open={isWaterTipsOpen}
              onOpenChange={setIsWaterTipsOpen}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Droplets className="h-5 w-5 text-primary mr-2" />
                      <CardTitle>AI Generated Water-Saving Recommendations</CardTitle>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        {isWaterTipsOpen ? <X className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CardDescription>
                    Personalised recommendations based on your usage patterns
                  </CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {waterSavingTips.map((tip, index) => (
                      <div
                        key={index}
                        className="border-l-4 pl-4 py-2"
                        style={{ borderColor: CATEGORY_COLORS[tip.category] || "#64748b" }}
                      >
                        <h4 className="font-medium text-sm">{tip.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Raw Events Table */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">All Water Events</h3>
            <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full bg-white">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr>
                    <th className="px-4 py-2">Event #</th>
                    <th className="px-4 py-2">Start Time</th>
                    <th className="px-4 py-2">End Time</th>
                    <th className="px-4 py-2">Volume (L)</th>
                    <th className="px-4 py-2">Duration (s)</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Day</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredEvents as WaterEventItem[]).map((event: WaterEventItem, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{event.eventNo}</td>
                      <td className="px-4 py-2">{event.startedAt}</td>
                      <td className="px-4 py-2">{event.finishedAt}</td>
                      <td className="px-4 py-2">{event.volume.toFixed(2)}</td>
                      <td className="px-4 py-2">{event.duration.toFixed(2)}</td>
                      <td className="px-4 py-2">{formatCategoryName(event.category)}</td>
                      <td className="px-4 py-2">{event.dayOfWeek || getDayOfWeek(event.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
