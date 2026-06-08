import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ChecklistItemSchema = z.object({
  metric: z.string(),
  category: z.string(),
  whatItIs: z.string(),
  whatItMeans: z.string(),
  verdict: z.enum(["positive", "negative", "neutral", "mixed"]),
  verdictReason: z.string(),
  value: z.string().nullable(),
  yoyChange: z.string().nullable(),
  qoqChange: z.string().nullable(),
  flags: z.string().nullable(),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  documentType: text("document_type").notNull(),
  documentHash: text("document_hash"),
  checklist: jsonb("checklist").notNull().$type<ChecklistItem[]>(),
  summary: text("summary").notNull(),
  overallVerdict: text("overall_verdict").notNull(),
  keyStrengths: jsonb("key_strengths").notNull().$type<string[]>(),
  keyRisks: jsonb("key_risks").notNull().$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
