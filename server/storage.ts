import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  users, badges, userBadges, reputationLogs, followers,
  type User, type InsertUser, type Badge, type InsertBadge,
  type UserBadge, type InsertUserBadge, type ReputationLog, 
  type InsertReputationLog, type Follower, type InsertFollower
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
  
  // Follower management
  followUser(follower: InsertFollower): Promise<Follower>;
  unfollowUser(followerId: number, followingId: number): Promise<void>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
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
}

// Use the database storage
export const storage = new DatabaseStorage();
