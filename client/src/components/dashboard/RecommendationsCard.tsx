import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WaterUsageData, Recommendation } from "@/types/water";
import { AlarmClockCheck, PackagePlus } from "lucide-react";
import { useState } from "react";

interface RecommendationsCardProps {
  isLoading: boolean;
  data?: WaterUsageData;
}

// Helper function to get border color based on recommendation type
const getBorderColor = (type: string) => {
  switch(type) {
    case "shower": return "border-secondary";
    case "washing_machine": return "border-accent";
    case "leak": return "border-status-error";
    case "faucet": return "border-primary";
    default: return "border-muted";
  }
};

export default function RecommendationsCard({
  isLoading,
  data,
}: RecommendationsCardProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-l-4 border-muted pl-3 py-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
            ))}
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations = data?.recommendations || [];
  const displayRecommendations = showAll 
    ? recommendations 
    : recommendations.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Recommendations</CardTitle>
          <AlarmClockCheck className="text-primary h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayRecommendations.length > 0 ? (
            <>
              {displayRecommendations.map((recommendation: Recommendation, index: number) => (
                <div 
                  key={index} 
                  className={`border-l-4 ${getBorderColor(recommendation.type)} pl-3 py-1`}
                >
                  <h4 className="text-sm font-medium">{recommendation.title}</h4>
                  <p className="text-sm text-neutral-600 mt-1">{recommendation.description}</p>
                </div>
              ))}
              
              {recommendations.length > 4 && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 flex items-center justify-center text-primary text-sm font-medium py-2 hover:bg-blue-50 rounded"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    "Show Less"
                  ) : (
                    <>
                      <PackagePlus className="h-4 w-4 mr-1" />
                      View More Recommendations
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No recommendations available.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
