import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WaterUsageData } from "@/types/water";
import {
  Droplet,
  BarChart3,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface UsageSummaryCardsProps {
  timeRange: string;
  isLoading: boolean;
  data?: WaterUsageData;
}

export default function UsageSummaryCards({
  timeRange,
  isLoading,
  data,
}: UsageSummaryCardsProps) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-4 w-40 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Usage Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Total Usage</p>
              <p className="text-2xl font-semibold font-mono">
                {data?.totalUsage || "0"} L
              </p>
            </div>
            <Droplet className="text-primary h-6 w-6" />
          </div>
          <div className="mt-2 flex items-center text-xs">
            {data?.usageComparison && data.usageComparison > 0 ? (
              <span className="text-red-500 flex items-center">
                <span className="material-icons text-xs mr-1">arrow_upward</span>
                {Math.abs(data.usageComparison)}% vs last {timeRange}
              </span>
            ) : (
              <span className="text-green-500 flex items-center">
                <span className="material-icons text-xs mr-1">arrow_downward</span>
                {Math.abs(data?.usageComparison || 0)}% vs last {timeRange}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Peak Flow Rate Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Peak Flow Rate</p>
              <p className="text-2xl font-semibold font-mono">
                {data?.peakFlow || "0"} L/min
              </p>
            </div>
            <BarChart3 className="text-blue-500 h-6 w-6" />
          </div>
          <div className="mt-2 text-xs">
            <span className="text-neutral-500">
              {data?.peakFlowTime ? `Detected at ${data.peakFlowTime}` : "No peak detected"}
              {data?.peakFlowCategory ? ` (${data.peakFlowCategory})` : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage Events Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Usage Events</p>
              <p className="text-2xl font-semibold font-mono">
                {data?.eventCount || "0"}
              </p>
            </div>
            <Calendar className="text-green-500 h-6 w-6" />
          </div>
          <div className="mt-2 text-xs">
            <span className="text-neutral-500">
              {data?.categoryCount ? `${data.categoryCount} categories detected` : "No events detected"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Detected Anomalies</p>
              <p className="text-2xl font-semibold font-mono">
                {data?.anomalyCount || "0"}
              </p>
            </div>
            <AlertTriangle className="text-red-500 h-6 w-6" />
          </div>
          <div className="mt-2 text-xs">
            {data?.anomalyCount && data.anomalyCount > 0 ? (
              <span className="text-red-500">{data.anomalyDescription || "Anomalies detected"}</span>
            ) : (
              <span className="text-green-500">No anomalies detected</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
