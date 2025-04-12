import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Settings } from "@/types/water";

export function useSettings() {
  // Get user settings
  const getSettings = async (): Promise<Settings> => {
    const res = await apiRequest("GET", "/api/settings");
    return await res.json();
  };

  // Update user settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Settings) => {
      const res = await apiRequest("PUT", "/api/settings", settings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  // Reset settings to default
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/settings/reset");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  // Delete all user data
  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/user/data");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water/usage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/water/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  return {
    getSettings,
    updateSettings: updateSettingsMutation.mutateAsync,
    resetSettings: resetSettingsMutation.mutateAsync,
    deleteAllData: deleteAllDataMutation.mutateAsync,
    isPending: 
      updateSettingsMutation.isPending || 
      resetSettingsMutation.isPending || 
      deleteAllDataMutation.isPending,
  };
}
