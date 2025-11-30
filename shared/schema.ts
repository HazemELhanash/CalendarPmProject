import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  category: text("category").notNull(),
  color: text("color").notNull(),
  isCompleted: boolean("is_completed").default(false),
  recurrenceRule: text("recurrence_rule"),
  parentId: varchar("parent_id"),
  isRecurring: boolean("is_recurring").default(false),
  isException: boolean("is_exception").default(false),
  recurrenceEnd: timestamp("recurrence_end"),
  isAllDay: boolean("is_all_day").default(false),
  
  // Project Management fields
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: text("status").default("todo"), // 'todo', 'in_progress', 'done', 'blocked', 'cancelled'
  assignee: text("assignee"), // user ID or name
  project: text("project"), // project/workspace name
  tags: jsonb("tags").$type<string[]>(), // array of tag names
  estimatedHours: integer("estimated_hours"), // in hours
  actualHours: integer("actual_hours"), // in hours
  dependencies: jsonb("dependencies").$type<string[]>(), // array of dependent task IDs
  subtasks: jsonb("subtasks").$type<{id: string, title: string, completed: boolean}[]>(), // array of subtasks
  attachments: jsonb("attachments").$type<{name: string, url: string, type: string}[]>(), // array of attachments
  comments: jsonb("comments").$type<{id: string, author: string, content: string, timestamp: string}[]>(), // array of comments
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
}).refine((data) => {
  if (!data.isAllDay && (!data.endTime || data.startTime >= data.endTime)) {
    return false;
  }
  return true;
}, {
  message: "End time must be after start time for timed events",
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
