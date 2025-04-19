import { eq, and, desc, count, gte, lte, isNull, isNotNull, or } from "drizzle-orm";
import { db } from "./db";
import { 
  users, badges, userBadges, reputationLogs, followers, 
  threadSubscriptions, notifications, achievements, userAchievements,
  userStats, reputationLevels,
  type User, type InsertUser, type Badge, type InsertBadge,
  type UserBadge, type InsertUserBadge, type ReputationLog, 
  type InsertReputationLog, type Follower, type InsertFollower,
  type ThreadSubscription, type InsertThreadSubscription,
  type Notification, type InsertNotification,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement,
  type UserStats, type InsertUserStats,
  type ReputationLevel, type InsertReputationLevel
} from "@shared/schema";

// Enhanced storage interface for user profiles and reputation systems
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByNostrPubkey(pubkey: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateLastSeen(id: number): Promise<void>;
  
  // Badge management
  getBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // User badges
  getUserBadges(userId: number): Promise<UserBadge[]>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  removeBadge(userId: number, badgeId: number): Promise<void>;
  
  // Reputation management
  getUserReputation(userId: number): Promise<number>;
  addReputationPoints(log: InsertReputationLog): Promise<ReputationLog>;
  getReputationLogs(userId: number): Promise<ReputationLog[]>;
  
  // Achievement management
  getAchievements(includeHidden?: boolean): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  updateAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement | undefined>;
  
  // User stats management
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(userStats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, statsData: Partial<InsertUserStats>): Promise<UserStats | undefined>;
  incrementUserStats(userId: number, field: keyof Omit<UserStats, 'id' | 'userId' | 'lastUpdated'>, amount?: number): Promise<void>;
  
  // Reputation levels
  getReputationLevels(): Promise<ReputationLevel[]>;
  getReputationLevel(level: number): Promise<ReputationLevel | undefined>;
  getReputationLevelByPoints(points: number): Promise<ReputationLevel | undefined>;
  createReputationLevel(level: InsertReputationLevel): Promise<ReputationLevel>;
  
  // Follower management
  followUser(follower: InsertFollower): Promise<Follower>;
  unfollowUser(followerId: number, followingId: number): Promise<void>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  
  // Thread subscription management
  subscribeToThread(subscription: InsertThreadSubscription): Promise<ThreadSubscription>;
  unsubscribeFromThread(userId: number, threadId: string): Promise<void>;
  getUserSubscriptions(userId: number): Promise<ThreadSubscription[]>;
  isUserSubscribed(userId: number, threadId: string): Promise<boolean>;
  updateThreadSubscription(userId: number, threadId: string, updates: Partial<InsertThreadSubscription>): Promise<ThreadSubscription | undefined>;
  
  // Notification management
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number, includeRead?: boolean): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  countUnreadNotifications(userId: number): Promise<number>;
  deleteNotification(notificationId: number): Promise<void>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByNostrPubkey(pubkey: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.nostrPubkey, pubkey));
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Ensure required values have defaults
    const userToInsert = {
      ...userData,
      nostrPrivkey: userData.nostrPrivkey || null,
      settings: userData.settings || {},
      createdAt: new Date(),
      lastSeen: new Date(),
      isAdmin: false,
      isModerator: false,
      isVerified: false,
      postCount: 0,
      reputationScore: 0
    };
    
    const result = await db.insert(users).values(userToInsert).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async updateLastSeen(id: number): Promise<void> {
    await db.update(users)
      .set({ lastSeen: new Date() })
      .where(eq(users.id, id));
  }
  
  // Badge management methods
  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }
  
  async getBadge(id: number): Promise<Badge | undefined> {
    const result = await db.select().from(badges).where(eq(badges.id, id));
    return result[0];
  }
  
  async createBadge(badgeData: InsertBadge): Promise<Badge> {
    const result = await db.insert(badges).values(badgeData).returning();
    return result[0];
  }
  
  // User badges methods
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return db.select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
  }
  
  async awardBadge(userBadgeData: InsertUserBadge): Promise<UserBadge> {
    const result = await db.insert(userBadges)
      .values({
        ...userBadgeData,
        awardedAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async removeBadge(userId: number, badgeId: number): Promise<void> {
    await db.delete(userBadges)
      .where(
        eq(userBadges.userId, userId) && 
        eq(userBadges.badgeId, badgeId)
      );
  }
  
  // Reputation management methods
  async getUserReputation(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    return user?.reputationScore || 0;
  }
  
  async addReputationPoints(logData: InsertReputationLog): Promise<ReputationLog> {
    // First insert the log
    const result = await db.insert(reputationLogs)
      .values({
        ...logData,
        createdAt: new Date()
      })
      .returning();
    
    // Then update the user's total reputation score
    const user = await this.getUser(logData.userId);
    if (user) {
      await db.update(users)
        .set({ 
          reputationScore: (user.reputationScore || 0) + logData.amount
        })
        .where(eq(users.id, logData.userId));
    }
      
    return result[0];
  }
  
  async getReputationLogs(userId: number): Promise<ReputationLog[]> {
    return db.select()
      .from(reputationLogs)
      .where(eq(reputationLogs.userId, userId))
      .orderBy(reputationLogs.createdAt);
  }
  
  // Achievement management methods
  async getAchievements(includeHidden: boolean = false): Promise<Achievement[]> {
    if (includeHidden) {
      return db.select().from(achievements);
    } else {
      return db.select().from(achievements).where(eq(achievements.isHidden, false));
    }
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const result = await db.select().from(achievements).where(eq(achievements.id, id));
    return result[0];
  }
  
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const result = await db.insert(achievements)
      .values({
        ...achievementData,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return db.select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }
  
  async awardAchievement(userAchievementData: InsertUserAchievement): Promise<UserAchievement> {
    const result = await db.insert(userAchievements)
      .values({
        ...userAchievementData,
        unlockedAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async updateAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement | undefined> {
    // Check if the user already has this achievement
    const existing = await db.select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
      
    if (existing.length === 0) {
      // Create a new progress record
      const result = await db.insert(userAchievements)
        .values({
          userId,
          achievementId,
          progress,
          unlockedAt: progress === 100 ? new Date() : null
        })
        .returning();
      return result[0];
    } else {
      // Update existing progress
      const result = await db.update(userAchievements)
        .set({ 
          progress,
          unlockedAt: progress === 100 ? new Date() : existing[0].unlockedAt
        })
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        )
        .returning();
      return result[0];
    }
  }
  
  // User stats management methods
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const result = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return result[0];
  }
  
  async createUserStats(userStatsData: InsertUserStats): Promise<UserStats> {
    const result = await db.insert(userStats)
      .values({
        ...userStatsData,
        lastUpdated: new Date()
      })
      .returning();
    return result[0];
  }
  
  async updateUserStats(userId: number, statsData: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    const result = await db.update(userStats)
      .set({
        ...statsData,
        lastUpdated: new Date()
      })
      .where(eq(userStats.userId, userId))
      .returning();
    return result[0];
  }
  
  async incrementUserStats(userId: number, field: keyof Omit<UserStats, 'id' | 'userId' | 'lastUpdated'>, amount: number = 1): Promise<void> {
    // Check if stats exist for this user
    const stats = await this.getUserStats(userId);
    
    if (!stats) {
      // Create default stats with the incremented field
      const defaultStats: any = {
        userId,
        postsCreated: 0,
        threadsCreated: 0,
        postsRepliedTo: 0,
        imagesUploaded: 0,
        reactionsReceived: 0,
        totalViews: 0,
        reputationPoints: 0,
        karmaPoints: 0
      };
      
      defaultStats[field] = amount;
      await this.createUserStats(defaultStats);
    } else {
      // Increment the existing field
      const updateData: any = { lastUpdated: new Date() };
      updateData[field] = (stats as any)[field] + amount;
      
      await db.update(userStats)
        .set(updateData)
        .where(eq(userStats.userId, userId));
    }
  }
  
  // Reputation levels
  async getReputationLevels(): Promise<ReputationLevel[]> {
    return db.select().from(reputationLevels).orderBy(reputationLevels.level);
  }
  
  async getReputationLevel(level: number): Promise<ReputationLevel | undefined> {
    const result = await db.select().from(reputationLevels).where(eq(reputationLevels.level, level));
    return result[0];
  }
  
  async getReputationLevelByPoints(points: number): Promise<ReputationLevel | undefined> {
    const result = await db.select().from(reputationLevels)
      .where(
        and(
          lte(reputationLevels.minPoints, points),
          or(
            isNull(reputationLevels.maxPoints),
            gte(reputationLevels.maxPoints, points)
          )
        )
      )
      .orderBy(desc(reputationLevels.level))
      .limit(1);
    
    return result[0];
  }
  
  async createReputationLevel(levelData: InsertReputationLevel): Promise<ReputationLevel> {
    const result = await db.insert(reputationLevels)
      .values(levelData)
      .returning();
    return result[0];
  }
  
  // Follower management methods
  async followUser(followerData: InsertFollower): Promise<Follower> {
    const result = await db.insert(followers)
      .values({
        ...followerData,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    await db.delete(followers)
      .where(
        eq(followers.followerId, followerId) && 
        eq(followers.followingId, followingId)
      );
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    const followerRecords = await db.select()
      .from(followers)
      .where(eq(followers.followingId, userId));
      
    // Get full user details for each follower
    const followerUsers = [];
    for (const record of followerRecords) {
      const user = await this.getUser(record.followerId);
      if (user) followerUsers.push(user);
    }
    
    return followerUsers;
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    const followingRecords = await db.select()
      .from(followers)
      .where(eq(followers.followerId, userId));
      
    // Get full user details for each followed user
    const followingUsers = [];
    for (const record of followingRecords) {
      const user = await this.getUser(record.followingId);
      if (user) followingUsers.push(user);
    }
    
    return followingUsers;
  }
  
  // Thread subscription methods
  async subscribeToThread(subscriptionData: InsertThreadSubscription): Promise<ThreadSubscription> {
    // Check if already subscribed
    const existing = await db.select()
      .from(threadSubscriptions)
      .where(
        and(
          eq(threadSubscriptions.userId, subscriptionData.userId),
          eq(threadSubscriptions.threadId, subscriptionData.threadId)
        )
      );
      
    if (existing.length > 0) {
      return existing[0];
    }
    
    const result = await db.insert(threadSubscriptions)
      .values({
        ...subscriptionData,
        createdAt: new Date(),
        lastNotified: new Date()
      })
      .returning();
      
    return result[0];
  }
  
  async unsubscribeFromThread(userId: number, threadId: string): Promise<void> {
    await db.delete(threadSubscriptions)
      .where(
        and(
          eq(threadSubscriptions.userId, userId),
          eq(threadSubscriptions.threadId, threadId)
        )
      );
  }
  
  async getUserSubscriptions(userId: number): Promise<ThreadSubscription[]> {
    return db.select()
      .from(threadSubscriptions)
      .where(eq(threadSubscriptions.userId, userId))
      .orderBy(desc(threadSubscriptions.createdAt));
  }
  
  async isUserSubscribed(userId: number, threadId: string): Promise<boolean> {
    const result = await db.select({ count: count() })
      .from(threadSubscriptions)
      .where(
        and(
          eq(threadSubscriptions.userId, userId),
          eq(threadSubscriptions.threadId, threadId)
        )
      );
      
    return result[0].count > 0;
  }
  
  async updateThreadSubscription(
    userId: number, 
    threadId: string, 
    updates: Partial<InsertThreadSubscription>
  ): Promise<ThreadSubscription | undefined> {
    const result = await db.update(threadSubscriptions)
      .set(updates)
      .where(
        and(
          eq(threadSubscriptions.userId, userId),
          eq(threadSubscriptions.threadId, threadId)
        )
      )
      .returning();
      
    return result[0];
  }
  
  // Notification methods
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications)
      .values({
        ...notificationData,
        read: false,
        createdAt: new Date()
      })
      .returning();
      
    return result[0];
  }
  
  async getUserNotifications(
    userId: number, 
    limit: number = 50, 
    includeRead: boolean = false
  ): Promise<Notification[]> {
    const queryConditions = includeRead 
      ? eq(notifications.userId, userId)
      : and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        );
    
    return db.select()
      .from(notifications)
      .where(queryConditions)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }
  
  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }
  
  async countUnreadNotifications(userId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
      
    return result[0].count;
  }
  
  async deleteNotification(notificationId: number): Promise<void> {
    await db.delete(notifications)
      .where(eq(notifications.id, notificationId));
  }
}

// Use the database storage
export const storage = new DatabaseStorage();
