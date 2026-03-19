import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const policyStatusEnum = pgEnum("policy_status", ["draft", "active", "under_review", "retired"]);

export const policiesTable = pgTable("policies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coveredControls: text("covered_controls").array().notNull().default([]),
  status: policyStatusEnum("status").notNull().default("draft"),
  lastReviewed: text("last_reviewed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPolicySchema = createInsertSchema(policiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Policy = typeof policiesTable.$inferSelect;
