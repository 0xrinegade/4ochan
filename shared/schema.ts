import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Since we're using Nostr, we don't need complex database schemas
// as most data is stored on Nostr relays.
// However, we can define a schema for user settings that we might
// want to persist across sessions.

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nostrPubkey: text("nostr_pubkey").notNull(),
  nostrPrivkey: text("nostr_privkey"),
  settings: jsonb("settings")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  nostrPubkey: true,
  nostrPrivkey: true,
  settings: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
