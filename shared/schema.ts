import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Water meter readings (raw data)
export const waterReadings = pgTable("water_readings", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  value: integer("value").notNull(), // in milliliters
});

// Water usage events (processed data)
export const waterEvents = pgTable("water_events", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration_seconds").notNull(), // in seconds
  volume: integer("volume").notNull(), // in milliliters
  peakFlowRate: integer("peak_flow_rate").notNull(), // in milliliters per minute
  avgFlowRate: integer("avg_flow_rate").notNull(), // in milliliters per minute
  category: text("category").notNull(),
  confidence: integer("confidence").notNull(), // AI classification confidence (0-100)
  anomaly: boolean("anomaly").default(false),
  anomalyDescription: text("anomaly_description"),
  flowData: jsonb("flow_data").notNull(), // Array of timestamp+value pairs
});

// User settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  dataRetention: text("data_retention").notNull().default("90"), // Days to keep detailed data
  storeRawData: boolean("store_raw_data").default(true),
  allowAiAnalysis: boolean("allow_ai_analysis").default(true),
  shareAnonymizedData: boolean("share_anonymized_data").default(true),
  shareWithUtility: boolean("share_with_utility").default(false),
  participateInCommunity: boolean("participate_in_community").default(false),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // Other user fields could be added here
});

// Schemas for inserting data
export const insertWaterReadingSchema = createInsertSchema(waterReadings).pick({
  timestamp: true,
  value: true,
});

export const insertWaterEventSchema = createInsertSchema(waterEvents).omit({
  id: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertWaterReading = z.infer<typeof insertWaterReadingSchema>;
export type WaterReading = typeof waterReadings.$inferSelect;

export type InsertWaterEvent = z.infer<typeof insertWaterEventSchema>;
export type WaterEvent = typeof waterEvents.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
