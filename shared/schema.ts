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
  bannerImage: text("banner_image"), // URL to profile banner/cover image
  bio: text("bio"),
  signature: text("signature"), // Text signature appended to posts
  location: varchar("location", { length: 255 }),
  website: text("website"),
  social: jsonb("social"), // JSON for social media links (Twitter, etc)
  interests: text("interests").array(), // Array of interests/topics
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isModerator: boolean("is_moderator").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  postCount: integer("post_count").default(0).notNull(),
  reputationScore: integer("reputation_score").default(0).notNull(),
  trustLevel: integer("trust_level").default(0).notNull(), // 0-5 trust level system
  karma: integer("karma").default(0).notNull(), // Positive contribution metric
  activityStreak: integer("activity_streak").default(0).notNull(), // Consecutive days active
  settings: jsonb("settings"), // General user settings
  customCss: text("custom_css"), // Optional user-specific CSS
  theme: varchar("theme", { length: 50 }).default("light"), // User's preferred theme
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
  bannerImage: true,
  bio: true,
  signature: true,
  location: true,
  website: true,
  social: true,
  interests: true,
  settings: true,
  customCss: true,
  theme: true,
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

// User achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url").notNull(),
  points: integer("points").default(0).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // posting, engagement, etc.
  requirements: jsonb("requirements").notNull(), // Criteria for unlocking
  isHidden: boolean("is_hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-achievement relationship
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id, { onDelete: "cascade" }).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  progress: integer("progress").default(0).notNull(), // For partial completion tracking
}, (t) => ({
  unq: unique().on(t.userId, t.achievementId),
}));

// User activity stats
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postsCreated: integer("posts_created").default(0).notNull(),
  threadsCreated: integer("threads_created").default(0).notNull(),
  postsRepliedTo: integer("posts_replied_to").default(0).notNull(),
  imagesUploaded: integer("images_uploaded").default(0).notNull(),
  reactionsReceived: integer("reactions_received").default(0).notNull(),
  totalViews: integer("total_views").default(0).notNull(),
  reputationPoints: integer("reputation_points").default(0).notNull(),
  karmaPoints: integer("karma_points").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.userId),
}));

// Reputation levels with thresholds and benefits
export const reputationLevels = pgTable("reputation_levels", {
  id: serial("id").primaryKey(),
  level: integer("level").notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description").notNull(),
  minPoints: integer("min_points").notNull(),
  maxPoints: integer("max_points"),
  color: varchar("color", { length: 7 }).notNull(),
  benefits: jsonb("benefits"), // Special privileges at this level
  iconUrl: text("icon_url"),
});

// Create insert schemas for achievements
export const insertAchievementSchema = createInsertSchema(achievements).pick({
  name: true,
  description: true,
  iconUrl: true,
  points: true,
  category: true,
  requirements: true,
  isHidden: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
  progress: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  postsCreated: true,
  threadsCreated: true,
  postsRepliedTo: true,
  imagesUploaded: true,
  reactionsReceived: true,
  totalViews: true,
  reputationPoints: true,
  karmaPoints: true,
});

export const insertReputationLevelSchema = createInsertSchema(reputationLevels).pick({
  level: true,
  name: true,
  description: true,
  minPoints: true,
  maxPoints: true,
  color: true,
  benefits: true,
  iconUrl: true,
});

// Create insert schemas for existing tables
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

// Define types for all tables
export type InsertFollower = z.infer<typeof insertFollowerSchema>;
export type Follower = typeof followers.$inferSelect;

export type InsertThreadSubscription = z.infer<typeof insertThreadSubscriptionSchema>;
export type ThreadSubscription = typeof threadSubscriptions.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

export type InsertReputationLevel = z.infer<typeof insertReputationLevelSchema>;
export type ReputationLevel = typeof reputationLevels.$inferSelect;
