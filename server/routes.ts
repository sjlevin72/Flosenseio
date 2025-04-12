import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import { insertWaterReadingSchema, insertWaterEventSchema } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  // ========================================================================
  
  // Water Readings
  // ------------------------------------------------------------------------
  
  // Get all readings within a time range
  app.get("/api/water/readings", async (req, res) => {
    try {
      const startTime = req.query.startTime ? new Date(req.query.startTime as string) : undefined;
      const endTime = req.query.endTime ? new Date(req.query.endTime as string) : undefined;
      
      const readings = await storage.getWaterReadings(startTime, endTime);
      res.json(readings);
    } catch (error) {
      console.error("Error fetching water readings:", error);
      res.status(500).json({ message: "Failed to fetch water readings" });
    }
  });
  
  // Add a new water reading
  app.post("/api/water/readings", async (req, res) => {
    try {
      const validatedData = insertWaterReadingSchema.parse(req.body);
      const reading = await storage.addWaterReading({
        timestamp: new Date(validatedData.timestamp),
        value: validatedData.value
      });
      
      // Process readings to detect events
      await processNewReading(reading);
      
      res.status(201).json(reading);
    } catch (error) {
      console.error("Error adding water reading:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data format", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add water reading" });
      }
    }
  });
  
  // Water Events
  // ------------------------------------------------------------------------
  
  // Get water events
  app.get("/api/water/events", async (req, res) => {
    try {
      const startTime = req.query.startTime ? new Date(req.query.startTime as string) : undefined;
      const endTime = req.query.endTime ? new Date(req.query.endTime as string) : undefined;
      const category = req.query.category as string | undefined;
      
      const events = await storage.getWaterEvents(startTime, endTime, category);
      res.json(events);
    } catch (error) {
      console.error("Error fetching water events:", error);
      res.status(500).json({ message: "Failed to fetch water events" });
    }
  });
  
  // Get a specific water event
  app.get("/api/water/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getWaterEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error(`Error fetching water event ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch water event" });
    }
  });
  
  // Update event category
  app.patch("/api/water/events/:id/categorize", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const { category } = req.body;
      if (!category || typeof category !== "string") {
        return res.status(400).json({ message: "Category is required" });
      }
      
      const updatedEvent = await storage.updateWaterEventCategory(eventId, category);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error(`Error updating water event ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update water event" });
    }
  });
  
  // Flag event as anomaly
  app.patch("/api/water/events/:id/flag", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const { isAnomaly, reason } = req.body;
      if (typeof isAnomaly !== "boolean") {
        return res.status(400).json({ message: "isAnomaly field is required" });
      }
      
      const updatedEvent = await storage.flagWaterEvent(eventId, isAnomaly, reason);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error(`Error flagging water event ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to flag water event" });
    }
  });
  
  // Water Usage Dashboard Data
  // ------------------------------------------------------------------------
  
  // Get aggregated water usage data for dashboard
  app.get("/api/water/usage", async (req, res) => {
    try {
      const timeRange = req.query.timeRange as string || "week";
      
      // Calculate date range based on timeRange
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case "day":
          startDate.setDate(startDate.getDate() - 1);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // Default to week
      }
      
      // Get readings and events within the time range
      const readings = await storage.getWaterReadings(startDate, endDate);
      const events = await storage.getWaterEvents(startDate, endDate);
      
      // Calculate total usage
      const totalUsageML = readings.reduce((sum, reading) => sum + reading.value, 0);
      const totalUsage = (totalUsageML / 1000).toFixed(1); // Convert to liters
      
      // Get usage from previous period for comparison
      const prevStartDate = new Date(startDate);
      const prevEndDate = new Date(startDate);
      
      switch (timeRange) {
        case "day":
          prevStartDate.setDate(prevStartDate.getDate() - 1);
          break;
        case "week":
          prevStartDate.setDate(prevStartDate.getDate() - 7);
          break;
        case "month":
          prevStartDate.setMonth(prevStartDate.getMonth() - 1);
          break;
        case "year":
          prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
          break;
      }
      
      const prevReadings = await storage.getWaterReadings(prevStartDate, prevEndDate);
      const prevTotalUsageML = prevReadings.reduce((sum, reading) => sum + reading.value, 0);
      
      let usageComparison = 0;
      if (prevTotalUsageML > 0) {
        usageComparison = Math.round(((totalUsageML - prevTotalUsageML) / prevTotalUsageML) * 100);
      }
      
      // Find peak flow
      let peakFlow = "0";
      let peakFlowTime = "";
      let peakFlowCategory = "";
      
      if (readings.length > 0) {
        const peakReading = readings.reduce((max, reading) => 
          reading.value > max.value ? reading : max, readings[0]);
        
        peakFlow = (peakReading.value / 1000).toFixed(1); // Convert to liters
        peakFlowTime = new Date(peakReading.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Find which event this peak reading belongs to
        const eventAtPeak = events.find(event => 
          new Date(event.startTime) <= new Date(peakReading.timestamp) && 
          new Date(event.endTime) >= new Date(peakReading.timestamp)
        );
        
        if (eventAtPeak) {
          peakFlowCategory = eventAtPeak.category;
        }
      }
      
      // Count anomalies
      const anomalies = events.filter(event => event.anomaly);
      const anomalyCount = anomalies.length;
      const anomalyDescription = anomalies.length > 0 ? 
        anomalies[0].anomalyDescription || "Possible leak detected" : undefined;
      
      // Categorize and count events
      const categories = {};
      events.forEach(event => {
        const category = event.category;
        const volumeL = event.volume / 1000; // Convert to liters
        
        if (!categories[category]) {
          categories[category] = { volume: 0 };
        }
        
        categories[category].volume += volumeL;
      });
      
      // Calculate percentages
      const categoryData = Object.entries(categories).map(([name, data]: [string, any]) => {
        const percentage = totalUsageML > 0 ? 
          ((data.volume * 1000 / totalUsageML) * 100).toFixed(1) : "0";
        
        return {
          name,
          volume: `${data.volume.toFixed(1)} L`,
          percentage
        };
      });
      
      // Sort categories by volume (descending)
      categoryData.sort((a, b) => 
        parseFloat(b.percentage) - parseFloat(a.percentage)
      );
      
      // Prepare flow data for chart
      // For simplicity, we're aggregating data to reduce points
      const aggregateInterval = timeRange === "day" ? 5*60*1000 : // 5 minutes for day view
                               timeRange === "week" ? 60*60*1000 : // 1 hour for week view
                               timeRange === "month" ? 12*60*60*1000 : // 12 hours for month view
                               24*60*60*1000; // 1 day for year view
      
      const flowData = [];
      let currentBucket = null;
      
      readings.forEach(reading => {
        const readingTime = new Date(reading.timestamp).getTime();
        const bucketStart = Math.floor(readingTime / aggregateInterval) * aggregateInterval;
        
        if (!currentBucket || currentBucket.time !== bucketStart) {
          if (currentBucket) {
            flowData.push({
              time: new Date(currentBucket.time).toISOString(),
              value: currentBucket.totalValue / currentBucket.count
            });
          }
          
          currentBucket = {
            time: bucketStart,
            totalValue: reading.value / 60000, // Convert mL to L/min
            count: 1
          };
        } else {
          currentBucket.totalValue += reading.value / 60000;
          currentBucket.count++;
        }
      });
      
      // Add the last bucket if it exists
      if (currentBucket) {
        flowData.push({
          time: new Date(currentBucket.time).toISOString(),
          value: currentBucket.totalValue / currentBucket.count
        });
      }
      
      // Format events for display
      const formattedEvents = events.map(event => {
        const startDate = new Date(event.startTime);
        const durationMinutes = event.duration / 60;
        const durationFormatted = durationMinutes >= 60 ?
          `${Math.floor(durationMinutes / 60)}h ${Math.round(durationMinutes % 60)}m` :
          `${Math.floor(durationMinutes)}m ${Math.round((durationMinutes % 1) * 60)}s`;
        
        const volumeL = (event.volume / 1000).toFixed(1);
        
        let flowRateStr = "";
        if (event.peakFlowRate === event.avgFlowRate) {
          flowRateStr = `${(event.avgFlowRate / 1000).toFixed(1)} L/min`;
        } else {
          flowRateStr = "Varied";
        }
        
        return {
          id: event.id,
          time: startDate.toLocaleString([], { 
            weekday: timeRange === "week" ? 'short' : undefined,
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          category: event.category,
          duration: durationFormatted,
          volume: `${volumeL} L`,
          flowRate: flowRateStr,
          startTime: event.startTime,
          endTime: event.endTime,
          anomaly: event.anomaly
        };
      });
      
      // Sort events by time (newest first)
      formattedEvents.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      
      // Generate AI recommendations
      const recommendations = await generateRecommendations(events, totalUsageML, usageComparison);
      
      // Compile response data
      const responseData = {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalUsage,
        usageComparison,
        peakFlow,
        peakFlowTime,
        peakFlowCategory,
        eventCount: events.length,
        categoryCount: Object.keys(categories).length,
        anomalyCount,
        anomalyDescription,
        flowData,
        events: formattedEvents,
        categories: categoryData,
        recommendations
      };
      
      res.json(responseData);
    } catch (error) {
      console.error("Error fetching water usage data:", error);
      res.status(500).json({ message: "Failed to fetch water usage data" });
    }
  });
  
  // AI Endpoints
  // ------------------------------------------------------------------------
  
  // Categorize a water event
  app.post("/api/ai/categorize", async (req, res) => {
    try {
      const { flowData } = req.body;
      
      if (!flowData || !Array.isArray(flowData)) {
        return res.status(400).json({ message: "Flow data is required" });
      }
      
      const result = await categorizeWaterEvent(flowData);
      res.json(result);
    } catch (error) {
      console.error("Error categorizing water event:", error);
      res.status(500).json({ message: "Failed to categorize water event" });
    }
  });
  
  // Generate recommendations
  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { usageData } = req.body;
      
      if (!usageData) {
        return res.status(400).json({ message: "Usage data is required" });
      }
      
      const recommendations = await generateRecommendations(
        usageData.events || [],
        usageData.totalUsageML || 0,
        usageData.usageComparison || 0
      );
      
      res.json({ recommendations });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });
  
  // Detect anomalies
  app.post("/api/ai/anomalies", async (req, res) => {
    try {
      const { flowData } = req.body;
      
      if (!flowData || !Array.isArray(flowData)) {
        return res.status(400).json({ message: "Flow data is required" });
      }
      
      const result = await detectAnomalies(flowData);
      res.json(result);
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      res.status(500).json({ message: "Failed to detect anomalies" });
    }
  });
  
  // Analyze event chains
  app.post("/api/ai/analyze-chain", async (req, res) => {
    try {
      const { events } = req.body;
      
      if (!events || !Array.isArray(events)) {
        return res.status(400).json({ message: "Events array is required" });
      }
      
      const result = await analyzeEventChain(events);
      res.json(result);
    } catch (error) {
      console.error("Error analyzing event chain:", error);
      res.status(500).json({ message: "Failed to analyze event chain" });
    }
  });
  
  // Settings
  // ------------------------------------------------------------------------
  
  // Get user settings
  app.get("/api/settings", async (req, res) => {
    try {
      // For now, we'll just return the first user's settings since we don't have authentication
      const userId = 1;
      let settings = await storage.getUserSettings(userId);
      
      // If no settings exist, create default ones
      if (!settings) {
        settings = await storage.createDefaultSettings(userId);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  // Update settings
  app.put("/api/settings", async (req, res) => {
    try {
      // For now, we'll just update the first user's settings
      const userId = 1;
      const updatedSettings = await storage.updateUserSettings(userId, req.body);
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
  
  // Reset to default settings
  app.post("/api/settings/reset", async (req, res) => {
    try {
      const userId = 1;
      const defaultSettings = await storage.createDefaultSettings(userId);
      
      res.json(defaultSettings);
    } catch (error) {
      console.error("Error resetting settings:", error);
      res.status(500).json({ message: "Failed to reset settings" });
    }
  });
  
  // Delete all user data
  app.delete("/api/user/data", async (req, res) => {
    try {
      const userId = 1;
      await storage.deleteAllUserData(userId);
      
      res.json({ message: "All user data deleted successfully" });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });
  
  // ========================================================================
  // Helper functions for event processing
  // ========================================================================
  
  // Process new readings to detect water events
  async function processNewReading(reading) {
    try {
      // Get recent readings to detect events
      const fiveMinutesAgo = new Date(new Date().getTime() - 5 * 60 * 1000);
      const recentReadings = await storage.getWaterReadings(fiveMinutesAgo);
      
      // Simple event detection logic
      // In a real app, this would be more sophisticated
      const currentReading = reading.value;
      
      // If flow is detected (> 67ml)
      if (currentReading > 67) {
        // Check if we're already tracking an active event
        const activeEvent = await storage.getActiveWaterEvent();
        
        if (!activeEvent) {
          // Start a new event
          await storage.startWaterEvent(reading.timestamp);
        } else {
          // Update the end time of the active event
          await storage.updateActiveWaterEvent(reading.timestamp, currentReading);
        }
      } else if (currentReading <= 67) {
        // Flow has stopped, check if we need to end an event
        const activeEvent = await storage.getActiveWaterEvent();
        
        if (activeEvent) {
          // End the active event
          const flowData = await storage.getWaterReadingsBetween(
            activeEvent.startTime,
            reading.timestamp
          );
          
          // Only end events that have at least 3 readings
          if (flowData.length >= 3) {
            // Calculate event stats
            const durationMs = new Date(reading.timestamp).getTime() - new Date(activeEvent.startTime).getTime();
            const durationSeconds = Math.round(durationMs / 1000);
            
            // Calculate total volume
            const totalVolume = flowData.reduce((sum, reading) => sum + reading.value, 0);
            
            // Calculate peak and average flow rates
            const flowRates = flowData.map(reading => reading.value);
            const peakFlowRate = Math.max(...flowRates);
            const avgFlowRate = Math.round(totalVolume / (durationSeconds / 60)); // mL per minute
            
            // Format flow data for storage
            const formattedFlowData = flowData.map(reading => ({
              time: reading.timestamp,
              value: reading.value / 60000 // Convert to L/min for display
            }));
            
            // Categorize the event using AI
            const category = await categorizeWaterEvent(formattedFlowData);
            
            // Create the completed event
            const waterEvent = {
              startTime: activeEvent.startTime,
              endTime: reading.timestamp,
              duration: durationSeconds,
              volume: totalVolume,
              peakFlowRate,
              avgFlowRate,
              category: category.category,
              confidence: Math.round(category.confidence * 100),
              flowData: formattedFlowData
            };
            
            // Check for anomalies
            const anomalyResult = await detectAnomalies(formattedFlowData);
            if (anomalyResult.anomalies.length > 0) {
              waterEvent.anomaly = true;
              waterEvent.anomalyDescription = anomalyResult.details;
            }
            
            // Save the event
            await storage.completeWaterEvent(waterEvent);
          } else {
            // Not enough readings, discard this event
            await storage.cancelActiveWaterEvent();
          }
        }
      }
    } catch (error) {
      console.error("Error processing water reading:", error);
    }
  }
  
  // Use OpenAI to categorize water events based on flow profile
  async function categorizeWaterEvent(flowData) {
    try {
      // Default response if AI fails
      const defaultResponse = {
        category: "other",
        confidence: 0.5,
        reasoning: "Unable to categorize event."
      };
      
      // If OpenAI API key is missing, return default
      if (!process.env.OPENAI_API_KEY) {
        console.warn("Missing OpenAI API key. Using default categorization.");
        return defaultResponse;
      }
      
      // Prepare data for OpenAI
      const flowProfile = flowData.map(point => ({
        time: new Date(point.time).toISOString(),
        flowRate: point.value // L/min
      }));
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a water usage pattern analyzer. You can identify common household water usage events based on their flow profiles.
            
            Common patterns include:
            - Shower: Long duration (3-15 minutes), steady medium-high flow rate (5-12 L/min)
            - Faucet: Short to medium duration (30s-3 minutes), low to medium flow rate (2-8 L/min)
            - Washing machine: Multiple distinct cycles, varied flow rates, longer total duration (30-90 minutes)
            - Dishwasher: Multiple distinct cycles, varied flow rates, medium duration (30-60 minutes)
            - Toilet: Very short duration (20-40 seconds), medium-high flow rate (8-12 L/min)
            - Irrigation: Long duration, consistent flow rate
            
            Analyze the flow profile data and determine the most likely category. Return the category, confidence level (0-1), and brief reasoning.`
          },
          {
            role: "user",
            content: `Please categorize this water usage event based on its flow profile: ${JSON.stringify(flowProfile)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        category: result.category || defaultResponse.category,
        confidence: result.confidence || defaultResponse.confidence,
        reasoning: result.reasoning || defaultResponse.reasoning
      };
    } catch (error) {
      console.error("Error categorizing water event:", error);
      return {
        category: "other",
        confidence: 0.5,
        reasoning: "Error during categorization."
      };
    }
  }
  
  // Use OpenAI to detect anomalies in water usage
  async function detectAnomalies(flowData) {
    try {
      // Default response if AI fails
      const defaultResponse = {
        anomalies: [],
        details: ""
      };
      
      // If OpenAI API key is missing, return default
      if (!process.env.OPENAI_API_KEY) {
        console.warn("Missing OpenAI API key. Using default anomaly detection.");
        return defaultResponse;
      }
      
      // Simple heuristic checks before using AI
      // Check for continuous low flow which might indicate a leak
      const lowFlowThreshold = 0.2; // L/min
      const lowFlowPoints = flowData.filter(point => point.value > 0 && point.value < lowFlowThreshold);
      
      if (lowFlowPoints.length >= 10) {
        return {
          anomalies: [
            {
              type: "possible_leak",
              severity: "medium",
              timeRange: {
                start: lowFlowPoints[0].time,
                end: lowFlowPoints[lowFlowPoints.length - 1].time
              }
            }
          ],
          details: "Continuous low flow detected, possibly indicating a leak."
        };
      }
      
      // Check for unusually high flow
      const highFlowThreshold = 15; // L/min
      const highFlowPoints = flowData.filter(point => point.value > highFlowThreshold);
      
      if (highFlowPoints.length >= 3) {
        return {
          anomalies: [
            {
              type: "high_flow",
              severity: "high",
              timeRange: {
                start: highFlowPoints[0].time,
                end: highFlowPoints[highFlowPoints.length - 1].time
              }
            }
          ],
          details: "Unusually high water flow detected, possibly indicating a burst pipe or open tap."
        };
      }
      
      // No anomalies detected by heuristics, use AI for deeper analysis
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a water usage anomaly detector. You analyze flow profiles to identify unusual patterns that might indicate problems like leaks, inefficient fixtures, or unusual usage patterns.
            
            Common anomalies include:
            - Continuous low flow (potential leak)
            - Unusually high flow rates (burst pipe)
            - Irregular patterns inconsistent with normal usage
            - Unexpected usage during typical inactive hours (2-5am)
            
            Analyze the flow profile data and determine if there are any anomalies. If none exist, return an empty anomalies array.`
          },
          {
            role: "user",
            content: `Please analyze this water flow profile for anomalies: ${JSON.stringify(flowData)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        anomalies: result.anomalies || [],
        details: result.details || ""
      };
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      return defaultResponse;
    }
  }
  
  // Use OpenAI to generate personalized recommendations
  async function generateRecommendations(events, totalUsageML, usageComparison) {
    try {
      // Default recommendations if AI fails
      const defaultRecommendations = [
        {
          id: "1",
          title: "Check for Leaks",
          description: "Regularly check faucets, toilets, and pipes for leaks. Even small leaks can waste significant amounts of water.",
          type: "general",
          priority: 1
        },
        {
          id: "2",
          title: "Shorter Showers",
          description: "Reducing your shower time by just 1 minute can save up to 150 gallons per month.",
          type: "shower",
          priority: 2
        },
        {
          id: "3",
          title: "Full Loads Only",
          description: "Run washing machines and dishwashers only when full to maximize water efficiency.",
          type: "washing_machine",
          priority: 3
        }
      ];
      
      // If OpenAI API key is missing, return default
      if (!process.env.OPENAI_API_KEY) {
        console.warn("Missing OpenAI API key. Using default recommendations.");
        return defaultRecommendations;
      }
      
      // Prepare data for OpenAI
      const categorySummary = {};
      
      events.forEach(event => {
        if (!categorySummary[event.category]) {
          categorySummary[event.category] = {
            count: 0,
            totalVolume: 0,
            avgDuration: 0
          };
        }
        
        categorySummary[event.category].count++;
        categorySummary[event.category].totalVolume += event.volume || 0;
        categorySummary[event.category].avgDuration += event.duration || 0;
      });
      
      // Calculate averages
      Object.keys(categorySummary).forEach(category => {
        const count = categorySummary[category].count;
        if (count > 0) {
          categorySummary[category].avgDuration = categorySummary[category].avgDuration / count;
        }
      });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a water conservation expert. Based on water usage data, you provide personalized recommendations to help users reduce water consumption and save money.
            
            Your recommendations should be:
            1. Specific and actionable
            2. Tailored to the user's actual usage patterns
            3. Prioritized by potential impact
            4. Include estimated water savings when possible
            
            Generate 3-5 recommendations in JSON format, each with:
            - id: unique identifier
            - title: short, descriptive title
            - description: detailed recommendation with specific actions and benefits
            - type: category (shower, faucet, washing_machine, dishwasher, toilet, irrigation, general, leak)
            - priority: 1-5 (1 being highest priority)`
          },
          {
            role: "user",
            content: `Please generate personalized water conservation recommendations based on this usage data:
            
            Total usage: ${totalUsageML / 1000} liters
            Comparison to previous period: ${usageComparison}%
            Usage by category: ${JSON.stringify(categorySummary)}
            `
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      if (result.recommendations && Array.isArray(result.recommendations)) {
        return result.recommendations;
      }
      
      return defaultRecommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [
        {
          id: "1",
          title: "Save Water Daily",
          description: "Small changes in daily habits can lead to significant water savings over time.",
          type: "general",
          priority: 1
        }
      ];
    }
  }
  
  // Analyze if multiple events form a logical chain
  async function analyzeEventChain(events) {
    try {
      // Default response if AI fails
      const defaultResponse = {
        isChain: false,
        chainType: "",
        explanation: ""
      };
      
      // If OpenAI API key is missing, return default
      if (!process.env.OPENAI_API_KEY) {
        console.warn("Missing OpenAI API key. Using default chain analysis.");
        return defaultResponse;
      }
      
      // If fewer than 2 events, can't be a chain
      if (!events || events.length < 2) {
        return defaultResponse;
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You analyze water usage events to determine if they form a logical chain of related activities.
            
            Common event chains include:
            - Morning routine: toilet → shower → bathroom sink
            - Laundry: washing machine → washing machine (multiple cycles)
            - Dishwashing: kitchen sink → dishwasher
            - Cleaning: sink → mop bucket → sink
            
            Analyze the sequence of events, their timing, categories, and volumes to determine if they form a logical chain of related water usage activities.`
          },
          {
            role: "user",
            content: `Do these water usage events form a logical chain? ${JSON.stringify(events)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        isChain: result.isChain || false,
        chainType: result.chainType || "",
        explanation: result.explanation || ""
      };
    } catch (error) {
      console.error("Error analyzing event chain:", error);
      return defaultResponse;
    }
  }
  
  const httpServer = createServer(app);
  return httpServer;
}
