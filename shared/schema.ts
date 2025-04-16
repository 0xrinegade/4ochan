import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Although most content data is stored on Nostr relays,
// we're enhancing our schema to support user profiles and reputation systems

// Core Users table with enhanced profile fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nostrPubkey: text("nostr_pubkey").notNull(),
  nostrPrivkey: text("nostr_privkey"),
  displayName: varchar("display_name", { length: 100 }),
  avatar: text("avatar"), // URL to avatar image
  bio: text("bio"),
  signature: text("signature"), // Text signature appended to posts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isModerator: boolean("is_moderator").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  postCount: integer("post_count").default(0).notNull(),
  reputationScore: integer("reputation_score").default(0).notNull(),
  settings: jsonb("settings"), // General user settings
  customCss: text("custom_css"), // Optional user-specific CSS
});

// User badges and achievements
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url").notNull(),
  color: varchar("color", { length: 7 }).default("#000000"),
  rarity: varchar("rarity", { length: 20 }).default("common"),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-badge relationship (many-to-many)
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  badgeId: integer("badge_id").references(() => badges.id, { onDelete: "cascade" }).notNull(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  awardReason: text("award_reason"),
}, (t) => ({
  unq: unique().on(t.userId, t.badgeId),
}));

// Reputation logs to track changes
export const reputationLogs = pgTable("reputation_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(), // post, reply, award, etc.
  sourceId: varchar("source_id", { length: 100 }), // ID of the related entity
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id),
});

// Follower relationships between users
export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  followingId: integer("following_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.followerId, t.followingId),
}));

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  badges: many(userBadges),
  reputationLogs: many(reputationLogs),
  followedBy: many(followers, { relationName: "followedByRelation" }),
  following: many(followers, { relationName: "followingRelation" }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users),
  badge: one(badges),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(users, { relationName: "followingRelation" }),
  following: one(users, { relationName: "followedByRelation" }),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  nostrPubkey: true,
  nostrPrivkey: true,
  displayName: true,
  avatar: true,
  bio: true,
  signature: true,
  settings: true,
  customCss: true,
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  iconUrl: true,
  color: true,
  rarity: true,
  isHidden: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).pick({
  userId: true,
  badgeId: true,
  awardReason: true,
});

export const insertReputationLogSchema = createInsertSchema(reputationLogs).pick({
  userId: true,
  amount: true,
  reason: true,
  sourceType: true,
  sourceId: true,
  createdById: true,
});

export const insertFollowerSchema = createInsertSchema(followers).pick({
  followerId: true,
  followingId: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

export type InsertReputationLog = z.infer<typeof insertReputationLogSchema>;
export type ReputationLog = typeof reputationLogs.$inferSelect;

export type InsertFollower = z.infer<typeof insertFollowerSchema>;
export type Follower = typeof followers.$inferSelect;
