import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import { Settings } from "@/types/water";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PrivacySettingsProps {
  settings: Settings | null;
  isLoading: boolean;
  onChange: (settings: Partial<Settings>) => void;
  isPending: boolean;
}

export default function PrivacySettings({
  settings,
  isLoading,
  onChange,
  isPending
}: PrivacySettingsProps) {
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-56" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-64" />
                </div>
              </div>
            </div>
            
            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-72" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-64" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-5 w-72" />
                </div>
                
                <div className="pt-2">
                  <Skeleton className="h-9 w-40" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Retention Settings */}
          <div>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Data Retention</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="retention-period" className="block text-sm font-medium text-neutral-700 mb-1">
                  Retain detailed flow data for:
                </Label>
                <Select 
                  value={settings?.dataRetention || "90"} 
                  onValueChange={(value) => onChange({ dataRetention: value })}
                  disabled={isPending}
                >
                  <SelectTrigger id="retention-period" className="w-full">
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-sm text-neutral-500">
                  Summarized data will be kept indefinitely for trend analysis.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="store-raw-data"
                  checked={settings?.storeRawData || false}
                  onCheckedChange={(checked) => onChange({ storeRawData: checked })}
                  disabled={isPending}
                />
                <Label htmlFor="store-raw-data" className="text-sm text-neutral-700">
                  Store raw sensor data for debugging
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="allow-ai"
                  checked={settings?.allowAiAnalysis || false}
                  onCheckedChange={(checked) => onChange({ allowAiAnalysis: checked })}
                  disabled={isPending}
                />
                <Label htmlFor="allow-ai" className="text-sm text-neutral-700">
                  Allow AI to analyze usage patterns
                </Label>
              </div>
            </div>
          </div>

          {/* Data Sharing Settings */}
          <div>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Data Sharing</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="anonymized-research"
                  checked={settings?.shareAnonymizedData || false}
                  onCheckedChange={(checked) => onChange({ shareAnonymizedData: checked })}
                  disabled={isPending}
                />
                <Label htmlFor="anonymized-research" className="text-sm text-neutral-700">
                  Share anonymized data for research purposes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="utility-provider"
                  checked={settings?.shareWithUtility || false}
                  onCheckedChange={(checked) => onChange({ shareWithUtility: checked })}
                  disabled={isPending}
                />
                <Label htmlFor="utility-provider" className="text-sm text-neutral-700">
                  Share usage statistics with utility provider
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="community-initiatives"
                  checked={settings?.participateInCommunity || false}
                  onCheckedChange={(checked) => onChange({ participateInCommunity: checked })}
                  disabled={isPending}
                />
                <Label htmlFor="community-initiatives" className="text-sm text-neutral-700">
                  Participate in community water saving initiatives
                </Label>
              </div>

              <div className="pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex items-center" disabled={isPending}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete All My Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your water usage data
                        and remove your records from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                        Yes, delete all data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
