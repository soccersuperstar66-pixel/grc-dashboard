import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jurisdictionEnum = pgEnum("jurisdiction", ["federal", "state", "international"]);
export const regulationStatusEnum = pgEnum("regulation_status", ["proposed", "enacted", "effective"]);

export const regulationsTable = pgTable("regulations", {
  id: serial("id").primaryKey(),
  lawName: text("law_name").notNull(),
  jurisdiction: jurisdictionEnum("jurisdiction").notNull(),
  status: regulationStatusEnum("status").notNull(),
  summary: text("summary").notNull(),
  relevantPolicies: text("relevant_policies").array().notNull().default([]),
  nextAction: text("next_action").notNull(),
  effectiveDate: text("effective_date"),
  deadlineDate: text("deadline_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRegulationSchema = createInsertSchema(regulationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRegulation = z.infer<typeof insertRegulationSchema>;
export type Regulation = typeof regulationsTable.$inferSelect;
