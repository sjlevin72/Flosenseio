import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { useToast } from '../hooks/use-toast';
import PrivacySettings from "../components/settings/PrivacySettings";
import { useSettings } from "../hooks/useSettings";
import { Settings as SettingsType } from "@/types/water";

export default function Settings() {
  const { toast } = useToast();
  const { getSettings, updateSettings } = useSettings();
  const [dirtyForm, setDirtyForm] = useState(false);
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  const [localSettings, setLocalSettings] = useState<SettingsType | null>(null);
  
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: SettingsType) => {
      await updateSettings(newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
      setDirtyForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });
  
  const handleChange = (newSettingsData: Partial<SettingsType>) => {
    if (localSettings) {
      setLocalSettings({
        ...localSettings,
        ...newSettingsData,
      });
      setDirtyForm(true);
    }
  };
  
  const handleSave = () => {
    if (localSettings) {
      updateSettingsMutation.mutate(localSettings);
    }
  };
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">Data & Privacy Settings</h2>
        <Button 
          onClick={handleSave} 
          disabled={!dirtyForm || isLoading || updateSettingsMutation.isPending}
        >
          Save Changes
        </Button>
      </div>
      
      <PrivacySettings 
        settings={localSettings} 
        isLoading={isLoading} 
        onChange={handleChange} 
        isPending={updateSettingsMutation.isPending}
      />
    </div>
  );
}
