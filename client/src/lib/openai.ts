import { apiRequest } from "./queryClient";
import { WaterEvent } from "@/types/water";

// Functions to interact with OpenAI through the backend
export const waterAI = {
  // Categorize a water usage event based on its flow profile
  categorizeEvent: async (flowData: any[]): Promise<{
    category: string;
    confidence: number;
    reasoning: string;
  }> => {
    try {
      const res = await apiRequest("POST", "/api/ai/categorize", { flowData });
      return await res.json();
    } catch (error) {
      console.error("Error categorizing water event:", error);
      throw error;
    }
  },

  // Generate personalized recommendations based on water usage patterns
  generateRecommendations: async (
    usageData: any
  ): Promise<{ recommendations: any[] }> => {
    try {
      const res = await apiRequest("POST", "/api/ai/recommendations", { usageData });
      return await res.json();
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  },

  // Detect anomalies in water usage data
  detectAnomalies: async (
    flowData: any[]
  ): Promise<{ anomalies: any[]; details: string }> => {
    try {
      const res = await apiRequest("POST", "/api/ai/anomalies", { flowData });
      return await res.json();
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      throw error;
    }
  },

  // Determine if multiple events are part of a chain (e.g., shower followed by washing machine)
  analyzeEventChain: async (
    events: WaterEvent[]
  ): Promise<{ isChain: boolean; chainType: string; explanation: string }> => {
    try {
      const res = await apiRequest("POST", "/api/ai/analyze-chain", { events });
      return await res.json();
    } catch (error) {
      console.error("Error analyzing event chain:", error);
      throw error;
    }
  }
};

export default waterAI;
