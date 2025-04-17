import { useQuery } from "@tanstack/react-query";

export function useWaterData() {
  // Fetch all water events from the new backend endpoint
  const { data: waterEvents = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/water-events"],
    queryFn: async () => {
      const res = await fetch("/api/water-events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return await res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    waterEvents,
    isLoading,
    refetch, // Expose refetch function
  };
}
