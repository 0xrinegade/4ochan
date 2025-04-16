import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, unique, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Thread subscriptions
export const threadSubscriptions = pgTable("thread_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  threadId: text("thread_id").notNull(), // Nostr thread event ID
  notifyOnReplies: boolean("notify_on_replies").default(true).notNull(),
  notifyOnMentions: boolean("notify_on_mentions").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastNotified: timestamp("last_notified").defaultNow(),
}, (t) => ({
  unq: unique().on(t.userId, t.threadId),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // reply, mention, badge, etc.
  threadId: text("thread_id"), // Optional Nostr thread event ID
  postId: text("post_id"), // Optional Nostr post event ID
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sourceUserId: integer("source_user_id").references(() => users.id), // Optional user who triggered notification
  data: jsonb("data"), // Additional data specific to notification type
});

// Create insert schemas for new tables
export const insertThreadSubscriptionSchema = createInsertSchema(threadSubscriptions).pick({
  userId: true,
  threadId: true,
  notifyOnReplies: true,
  notifyOnMentions: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  threadId: true,
  postId: true,
  message: true,
  sourceUserId: true,
  data: true,
});

export type InsertFollower = z.infer<typeof insertFollowerSchema>;
export type Follower = typeof followers.$inferSelect;

export type InsertThreadSubscription = z.infer<typeof insertThreadSubscriptionSchema>;
export type ThreadSubscription = typeof threadSubscriptions.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
