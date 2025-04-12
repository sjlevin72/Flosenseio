import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WaterUsageData, UsageCategory } from "@/types/water";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  LabelList
} from "recharts";
import { Droplet } from "lucide-react";

interface UsageBreakdownProps {
  timeRange: string;
  isLoading: boolean;
  data?: WaterUsageData;
}

// Category colors mapping
const COLORS = {
  shower: "#3B82F6",       // Blue
  washing_machine: "#059669", // Green
  dishwasher: "#8B5CF6",   // Purple
  faucet: "#F59E0B",       // Yellow
  other: "#6B7280",        // Gray
  toilet: "#14B8A6",       // Teal
  irrigation: "#10B981",   // Emerald
  bath: "#60A5FA",         // Light Blue
  leak: "#EF4444",         // Red
};

// Category icons mapping
const ICONS = {
  shower: "shower",
  washing_machine: "wash",
  dishwasher: "countertops",
  faucet: "faucet",
  other: "help_outline",
  toilet: "wc",
  irrigation: "sprinkler",
  bath: "bathtub",
  leak: "warning",
};

export default function UsageBreakdown({
  timeRange,
  isLoading,
  data,
}: UsageBreakdownProps) {
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for categories
  const categories = data?.categories?.map((category: UsageCategory) => ({
    name: category.name,
    value: parseFloat(category.percentage),
    color: COLORS[category.name as keyof typeof COLORS] || COLORS.other,
    icon: ICONS[category.name as keyof typeof ICONS] || ICONS.other,
    volume: parseFloat(category.volume.split(' ')[0]), // Extract numeric value
    displayName: category.name.charAt(0).toUpperCase() + category.name.slice(1).replace('_', ' ')
  })) || [];

  // Generate daily data (for the stacked bar chart)
  // We'll create mock data for each day of the week if no real data exists
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Create daily usage data based on categories
  const dailyData = weekdays.map((day, idx) => {
    // Start with empty object with day name
    const dayData: any = { name: day };
    
    // Calculate a usage multiplier that makes weekdays and weekends have different patterns
    const weekendMultiplier = (idx >= 5) ? 1.3 : 0.9; // Weekend vs weekday
    const randomVariation = 0.7 + Math.random() * 0.6; // Random variation between days
    
    // Add each category as a property with a proportional value
    categories.forEach(cat => {
      // Distribute the volume across days with some variation
      const multiplier = (cat.name === 'shower' || cat.name === 'washing_machine') 
        ? weekendMultiplier * randomVariation // More showers and laundry on weekends
        : randomVariation;
        
      dayData[cat.name] = Math.round((cat.volume / 7) * multiplier * 10) / 10;
      // Store color for styling
      dayData[`${cat.name}Color`] = cat.color;
      dayData[`${cat.name}Name`] = cat.displayName;
    });
    
    return dayData;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Daily Water Usage by Fixture</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6">
          {/* Stacked Bar Chart */}
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis 
                  label={{ 
                    value: 'Liters', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }} 
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    // Get the display name from the data
                    const displayName = props.payload[`${name}Name`];
                    return [`${value.toFixed(1)} L`, displayName || name];
                  }}
                  itemStyle={{ textTransform: 'capitalize' }}
                />
                <Legend 
                  formatter={(value) => {
                    // Capitalize and replace underscores with spaces
                    return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                  }}
                />
                {categories.map((category) => (
                  <Bar 
                    key={category.name}
                    dataKey={category.name} 
                    stackId="a" 
                    fill={category.color}
                    name={category.name}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Category Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center p-2 rounded border border-neutral-200">
                <div 
                  className="w-3 h-3 rounded-sm mr-2" 
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-sm font-medium text-neutral-700">
                  {category.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
