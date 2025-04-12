import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from "recharts";
import { Download } from "lucide-react";
import { WaterUsageData, FlowEvent } from "@/types/water";

interface FlowProfileChartProps {
  timeRange: string;
  isLoading: boolean;
  data?: WaterUsageData | any;
  startTime?: string;
  endTime?: string;
}

export default function FlowProfileChart({
  timeRange,
  isLoading,
  data,
  startTime,
  endTime
}: FlowProfileChartProps) {
  const [resolution, setResolution] = useState("5s");
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Mock events for visualization - in real app these would come from the API
  const eventMarkers: FlowEvent[] = data?.events || [];
  
  const handleExport = () => {
    // Implementation would create a CSV export of the chart data
    if (chartRef.current && data?.flowData) {
      // Create CSV content
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Time,Flow Rate (L/min)\n"
        + data.flowData.map((point: any) => `${point.time},${point.value}`).join("\n");
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `water-flow-data-${timeRange}.csv`);
      document.body.appendChild(link);
      
      // Trigger download and cleanup
      link.click();
      document.body.removeChild(link);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-6 w-24" />
            <div className="flex mt-2 sm:mt-0">
              <Skeleton className="h-8 w-24 mr-4" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full mb-4" />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Flow Profile</CardTitle>
          <div className="flex mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              className="mr-4"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <div className="flex items-center text-sm">
              <label htmlFor="resolution" className="mr-2 text-neutral-500">Resolution:</label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="5 seconds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5s">5 seconds</SelectItem>
                  <SelectItem value="1m">1 minute</SelectItem>
                  <SelectItem value="5m">5 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} style={{ height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data?.flowData || []}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="time" 
                tickFormatter={(tick) => {
                  // Format based on timeRange
                  if (timeRange === "day") return new Date(tick).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  if (timeRange === "week") return new Date(tick).toLocaleDateString([], {weekday: 'short'});
                  if (timeRange === "month") return new Date(tick).toLocaleDateString([], {day: 'numeric'});
                  if (timeRange === "event") return new Date(tick).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                  return tick;
                }}
                minTickGap={30}
              />
              <YAxis
                label={{ value: 'L/min', angle: -90, position: 'insideLeft' }}
                domain={[0, 'auto']}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} L/min`, 'Flow Rate']}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                fill="url(#colorFlow)"
              />
              
              {/* Reference areas for events */}
              {eventMarkers.map((event, index) => (
                <ReferenceArea
                  key={index}
                  x1={event.startTime}
                  x2={event.endTime}
                  stroke={event.color || "#3B82F6"}
                  strokeOpacity={0.3}
                  fill={event.color || "#3B82F6"}
                  fillOpacity={0.1}
                />
              ))}
              
              {/* Gradient fill under the line */}
              <defs>
                <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Event markers */}
        <div className="mt-2 flex flex-wrap gap-2">
          <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            <span className="material-icons text-xs mr-1">shower</span>
            Shower
          </div>
          <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            <span className="material-icons text-xs mr-1">wash</span>
            Washing Machine
          </div>
          <div className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
            <span className="material-icons text-xs mr-1">countertops</span>
            Dishwasher
          </div>
          <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
            <span className="material-icons text-xs mr-1">faucet</span>
            Faucet
          </div>
          <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
            <span className="material-icons text-xs mr-1">warning</span>
            Anomaly
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
