import { useState } from "react";
import UsageSummaryCards from "@/components/dashboard/UsageSummaryCards";
import FlowProfileChart from "@/components/dashboard/FlowProfileChart";
import UsageBreakdown from "@/components/dashboard/UsageBreakdown";
import RecommendationsCard from "@/components/dashboard/RecommendationsCard";
import AnomalyDetectionCard from "@/components/dashboard/AnomalyDetectionCard";
import EventsList from "@/components/events/EventsList";
import { useQuery } from "@tanstack/react-query";
import { useWaterData } from "@/hooks/useWaterData";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { WaterUsageData } from "@/types/water";

type TimeRange = "day" | "week" | "month" | "custom";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const { getFilteredData } = useWaterData();
  
  const { data: waterData, isLoading } = useQuery<WaterUsageData, Error>({
    queryKey: ['/api/water/usage', timeRange],
    select: (data) => data as WaterUsageData,
  });

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-semibold mb-2 sm:mb-0">
            <span className="text-primary">Flo</span><span className="text-neutral-900">sense</span> Water Usage Dashboard
          </h2>
          
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2 bg-white p-1 rounded-lg shadow-sm">
            <Button 
              variant={timeRange === "day" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange("day")}
            >
              Day
            </Button>
            <Button 
              variant={timeRange === "week" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange("week")}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === "month" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange("month")}
            >
              Month
            </Button>
            <Button 
              variant={timeRange === "custom" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setTimeRange("custom")}
              className="flex items-center"
            >
              <CalendarIcon className="mr-1 h-4 w-4" />
              <span>Custom</span>
            </Button>
          </div>
        </div>

        {/* Usage Summary Cards */}
        <UsageSummaryCards timeRange={timeRange} isLoading={isLoading} data={waterData} />

        {/* Flow Profile Chart */}
        <FlowProfileChart timeRange={timeRange} isLoading={isLoading} data={waterData} />

        {/* Usage Breakdown and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <UsageBreakdown timeRange={timeRange} isLoading={isLoading} data={waterData} />
          </div>
          <div className="space-y-6">
            <RecommendationsCard isLoading={isLoading} data={waterData} />
            <AnomalyDetectionCard isLoading={isLoading} data={waterData} />
          </div>
        </div>

        {/* Recent Water Usage Events */}
        <EventsList timeRange={timeRange} isLoading={isLoading} data={waterData} />
      </div>
    </div>
  );
}
