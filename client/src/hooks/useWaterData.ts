import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { WaterUsageData, WaterEvent } from "@/types/water";

export function useWaterData() {
  const [timeRange, setTimeRange] = useState<string>("week");

  // Fetch water usage data based on time range
  const getWaterUsageData = (range: string) => {
    return useQuery({
      queryKey: ['/api/water/usage', range],
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get event details by ID
  const getEventDetails = (id: string) => {
    return useQuery({
      queryKey: [`/api/water/events/${id}`],
      enabled: !!id,
    });
  };

  // Get filtered data based on parameters
  const getFilteredData = (params: any) => {
    return useQuery({
      queryKey: ['/api/water/filtered', params],
    });
  };

  // Add a new water meter reading
  const addWaterReading = useMutation({
    mutationFn: async (reading: { timestamp: string; value: number }) => {
      const res = await apiRequest("POST", "/api/water/readings", reading);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water/usage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/water/events'] });
    },
  });

  // Mark an event with user-defined category
  const categorizeEvent = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const res = await apiRequest("PATCH", `/api/water/events/${id}/categorize`, { category });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/water/events/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/water/usage'] });
    },
  });

  // Flag an event as anomaly or normal
  const flagEvent = useMutation({
    mutationFn: async ({ id, isAnomaly, reason }: { id: string; isAnomaly: boolean; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/water/events/${id}/flag`, { isAnomaly, reason });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/water/events/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/water/usage'] });
    },
  });

  return {
    timeRange,
    setTimeRange,
    getWaterUsageData,
    getEventDetails,
    getFilteredData,
    addWaterReading,
    categorizeEvent,
    flagEvent,
  };
}
