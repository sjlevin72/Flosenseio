import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropletIcon, AlertTriangleIcon, CheckCircleIcon, MailIcon, AlertOctagonIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { WaterUsageData, WaterEvent } from "@/types/water";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AnomalyDetectionCardProps {
  isLoading: boolean;
  data?: WaterUsageData;
}

export default function AnomalyDetectionCard({
  isLoading,
  data
}: AnomalyDetectionCardProps) {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  
  // Filter anomalies from events
  const anomalies = data?.events?.filter(event => event.anomaly) || [];
  
  // Determine status based on anomalies
  const status = anomalies.length > 0 ? "alert" : "normal";

  // Function to format the duration to be human-readable
  const formatDuration = (event: WaterEvent) => {
    return event.duration;
  };

  // Calculate water waste and cost for a leak
  const calculateWaste = (event: WaterEvent) => {
    // Extract volume in liters from the string format "X.X L"
    const volumeStr = event.volume;
    const volume = parseFloat(volumeStr.split(" ")[0]);
    
    // Estimate cost based on average water rates ($0.01 per liter as an example)
    const costPerLiter = 0.01;
    const cost = volume * costPerLiter;
    
    return {
      volume,
      cost: cost.toFixed(2)
    };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertTriangleIcon className="h-5 w-5 mr-2 text-amber-500" />
            Leak & Anomaly Detection
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="alerts-mode" className="text-xs text-muted-foreground cursor-pointer">
              Alerts
            </Label>
            <Switch
              id="alerts-mode"
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>
        </div>
        <CardDescription>
          Monitoring for unusual water usage patterns or potential leaks
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <div>
            <div className={`p-4 rounded-lg mb-4 ${
              status === "alert" 
                ? "bg-red-50 border border-red-200" 
                : "bg-green-50 border border-green-200"
            }`}>
              <div className="flex items-center">
                {status === "alert" ? (
                  <AlertOctagonIcon className="h-5 w-5 text-red-500 mr-2" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                )}
                <div>
                  <h4 className={`font-medium ${status === "alert" ? "text-red-700" : "text-green-700"}`}>
                    {status === "alert" 
                      ? `${anomalies.length} potential issue${anomalies.length > 1 ? "s" : ""} detected` 
                      : "All systems normal"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {status === "alert" 
                      ? "Unusual water usage patterns detected" 
                      : "No leaks or unusual patterns detected"}
                  </p>
                </div>
              </div>
            </div>

            {/* Anomaly List */}
            {anomalies.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="font-medium text-sm">Detected Anomalies:</h4>
                
                {anomalies.map((event) => {
                  const waste = calculateWaste(event);
                  
                  return (
                    <div key={event.id} className="border rounded-lg p-3 bg-neutral-50">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                          {event.anomalyDescription || "Unusual pattern"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium">{formatDuration(event)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Water Wasted</p>
                          <p className="font-medium">{event.volume}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Flow Rate</p>
                          <p className="font-medium">{event.flowRate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Est. Cost</p>
                          <p className="font-medium">${waste.cost}</p>
                        </div>
                      </div>
                      
                      <div className="flex mt-3 space-x-2">
                        <Button size="sm" variant="secondary" className="w-full">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center">
                          <MailIcon className="h-3 w-3 mr-1" />
                          <span>Alert</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State - No Anomalies */}
            {anomalies.length === 0 && (
              <div className="text-center py-6">
                <div className="bg-green-50 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                  <DropletIcon className="h-6 w-6 text-green-500" />
                </div>
                <h4 className="font-medium mb-1">No leaks detected</h4>
                <p className="text-sm text-muted-foreground">
                  Your water system appears to be operating normally.
                </p>
              </div>
            )}

            {/* Alert Settings */}
            {alertsEnabled && (
              <div className="mt-4 pt-4 border-t text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Continuous monitoring enabled
                  </span>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}