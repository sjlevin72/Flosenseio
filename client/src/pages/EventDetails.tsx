import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Droplet,
  Clock,
  BarChart,
  AlertTriangle,
} from "lucide-react";
import FlowProfileChart from "@/components/dashboard/FlowProfileChart";

export default function EventDetails() {
  const { id } = useParams();
  
  const { data: event, isLoading } = useQuery({
    queryKey: [`/api/water/events/${id}`],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-24 mr-4" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="outline" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h2 className="text-2xl font-semibold text-neutral-900">
          Event Details {id && `#${id}`}
        </h2>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            {event?.category === "shower" && (
              <span className="material-icons text-blue-500 mr-2">shower</span>
            )}
            {event?.category === "washing_machine" && (
              <span className="material-icons text-green-500 mr-2">wash</span>
            )}
            {event?.category === "dishwasher" && (
              <span className="material-icons text-purple-500 mr-2">countertops</span>
            )}
            {event?.category === "faucet" && (
              <span className="material-icons text-yellow-500 mr-2">faucet</span>
            )}
            {event?.category === "anomaly" && (
              <span className="material-icons text-red-500 mr-2">warning</span>
            )}
            {event?.category || "Unknown"} Usage Event
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event && (
            <>
              <FlowProfileChart 
                timeRange="event" 
                isLoading={false} 
                data={{ flowData: event.flowData }}
                startTime={event.startTime}
                endTime={event.endTime}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                        <h3 className="text-2xl font-bold font-mono">{event.volume} L</h3>
                      </div>
                      <Droplet className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <h3 className="text-2xl font-bold font-mono">{event.duration}</h3>
                      </div>
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Flow Rate</p>
                        <h3 className="text-2xl font-bold font-mono">{event.avgFlowRate} L/min</h3>
                      </div>
                      <BarChart className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {event.anomaly && (
                <Card className="mt-4 border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <h4 className="font-medium text-red-800">Anomaly Detected</h4>
                        <p className="text-sm text-red-700">{event.anomalyDescription}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
