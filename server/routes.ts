import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { 
  insertUserSchema, insertBadgeSchema, insertUserBadgeSchema, 
  insertReputationLogSchema, insertFollowerSchema,
  insertThreadSubscriptionSchema, insertNotificationSchema,
  type UserStats
} from '@shared/schema';

// Since we're using the Nostr protocol for content,
// these backend routes handle user profiles and reputation systems

import { authenticateWithAI, generateAIResponse, processUserInput } from "./openai";
import { getTokenAnalysis } from "./moralis";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ===== USER PROFILE ROUTES =====
  
  // Get user profile by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't expose sensitive fields
      const { password, nostrPrivkey, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user profile by Nostr pubkey
  app.get("/api/users/nostr/:pubkey", async (req, res) => {
    try {
      const { pubkey } = req.params;
      
      const user = await storage.getUserByNostrPubkey(pubkey);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't expose sensitive fields
      const { password, nostrPrivkey, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user by pubkey:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Validate user input (partial schema)
      const updateSchema = insertUserSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid user data", details: result.error });
      }

      // Don't allow updating password or keys through this endpoint
      const { password, nostrPrivkey, nostrPubkey, ...updateData } = result.data;

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't expose sensitive fields
      const { password: pwd, nostrPrivkey: privkey, ...safeUser } = updatedUser;
      return res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== BADGE ROUTES =====
  
  // Get all badges
  app.get("/api/badges", async (_req, res) => {
    try {
      const badges = await storage.getBadges();
      return res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get badges for a specific user
  app.get("/api/users/:id/badges", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const userBadges = await storage.getUserBadges(userId);
      return res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Award a badge to a user (admin only)
  app.post("/api/users/:id/badges", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Simple admin check (would use real auth in production)
      if (!req.headers["x-admin-token"] || req.headers["x-admin-token"] !== "admin-secret") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Validate badge data
      const badgeSchema = insertUserBadgeSchema.omit({ userId: true });
      const result = badgeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid badge data", details: result.error });
      }

      const userBadge = await storage.awardBadge({
        userId,
        badgeId: result.data.badgeId,
        awardReason: result.data.awardReason
      });

      return res.status(201).json(userBadge);
    } catch (error) {
      console.error("Error awarding badge:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== REPUTATION ROUTES =====
  
  // Get user's reputation score
  app.get("/api/users/:id/reputation", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const reputationScore = await storage.getUserReputation(userId);
      return res.json({ userId, reputationScore });
    } catch (error) {
      console.error("Error fetching reputation:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's reputation logs
  app.get("/api/users/:id/reputation/logs", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const logs = await storage.getReputationLogs(userId);
      return res.json(logs);
    } catch (error) {
      console.error("Error fetching reputation logs:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get user's reputation level
  app.get("/api/users/:id/reputation/level", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Get user's reputation score
      const reputationScore = await storage.getUserReputation(userId);
      
      // Get current level based on score
      const currentLevel = await storage.getReputationLevelByPoints(reputationScore);
      
      // Get next level if it exists
      let nextLevel = null;
      if (currentLevel) {
        const allLevels = await storage.getReputationLevels();
        const currentLevelIndex = allLevels.findIndex(level => level.id === currentLevel.id);
        
        if (currentLevelIndex >= 0 && currentLevelIndex < allLevels.length - 1) {
          nextLevel = allLevels[currentLevelIndex + 1];
        }
      }
      
      return res.json({ 
        currentLevel,
        nextLevel,
        currentScore: reputationScore
      });
    } catch (error) {
      console.error("Error fetching reputation level:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add reputation points (needs authorization in production)
  app.post("/api/users/:id/reputation", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Simple admin check (would use real auth in production)
      if (!req.headers["x-admin-token"] || req.headers["x-admin-token"] !== "admin-secret") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Validate reputation data
      const repSchema = insertReputationLogSchema.omit({ userId: true });
      const result = repSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid reputation data", details: result.error });
      }

      const log = await storage.addReputationPoints({
        userId,
        amount: result.data.amount,
        reason: result.data.reason,
        sourceType: result.data.sourceType,
        sourceId: result.data.sourceId,
        createdById: result.data.createdById
      });

      return res.status(201).json(log);
    } catch (error) {
      console.error("Error adding reputation:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== FOLLOWER ROUTES =====
  
  // Get user's followers
  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const followers = await storage.getFollowers(userId);
      
      // Don't expose sensitive fields
      const safeFollowers = followers.map(user => {
        const { password, nostrPrivkey, ...safeUser } = user;
        return safeUser;
      });
      
      return res.json(safeFollowers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get users that a user is following
  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const following = await storage.getFollowing(userId);
      
      // Don't expose sensitive fields
      const safeFollowing = following.map(user => {
        const { password, nostrPrivkey, ...safeUser } = user;
        return safeUser;
      });
      
      return res.json(safeFollowing);
    } catch (error) {
      console.error("Error fetching following:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Follow a user
  app.post("/api/users/:id/follow/:targetId", async (req, res) => {
    try {
      const followerId = parseInt(req.params.id);
      const followingId = parseInt(req.params.targetId);
      
      if (isNaN(followerId) || isNaN(followingId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      if (followerId === followingId) {
        return res.status(400).json({ error: "Users cannot follow themselves" });
      }

      // Check if users exist
      const follower = await storage.getUser(followerId);
      const following = await storage.getUser(followingId);
      
      if (!follower || !following) {
        return res.status(404).json({ error: "One or both users not found" });
      }

      const result = await storage.followUser({
        followerId,
        followingId
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error("Error following user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Unfollow a user
  app.delete("/api/users/:id/follow/:targetId", async (req, res) => {
    try {
      const followerId = parseInt(req.params.id);
      const followingId = parseInt(req.params.targetId);
      
      if (isNaN(followerId) || isNaN(followingId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      await storage.unfollowUser(followerId, followingId);
      return res.status(204).end();
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ===== THREAD SUBSCRIPTION ROUTES =====
  
  // Get all user's thread subscriptions
  app.get("/api/users/:id/subscriptions", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const subscriptions = await storage.getUserSubscriptions(userId);
      return res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Check if user is subscribed to a thread
  app.get("/api/users/:id/subscriptions/:threadId", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { threadId } = req.params;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      if (!threadId) {
        return res.status(400).json({ error: "Thread ID is required" });
      }

      const isSubscribed = await storage.isUserSubscribed(userId, threadId);
      return res.json({ userId, threadId, isSubscribed });
    } catch (error) {
      console.error("Error checking subscription:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Subscribe to a thread
  app.post("/api/users/:id/subscriptions", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Validate subscription data
      const subscriptionSchema = insertThreadSubscriptionSchema.omit({ userId: true });
      const result = subscriptionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid subscription data", details: result.error });
      }
      
      if (!result.data.threadId) {
        return res.status(400).json({ error: "Thread ID is required" });
      }

      const subscription = await storage.subscribeToThread({
        userId,
        threadId: result.data.threadId,
        notifyOnReplies: result.data.notifyOnReplies ?? true,
        notifyOnMentions: result.data.notifyOnMentions ?? true
      });

      return res.status(201).json(subscription);
    } catch (error) {
      console.error("Error subscribing to thread:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Unsubscribe from a thread
  app.delete("/api/users/:id/subscriptions/:threadId", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { threadId } = req.params;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      if (!threadId) {
        return res.status(400).json({ error: "Thread ID is required" });
      }

      await storage.unsubscribeFromThread(userId, threadId);
      return res.status(204).end();
    } catch (error) {
      console.error("Error unsubscribing from thread:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update subscription preferences
  app.patch("/api/users/:id/subscriptions/:threadId", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { threadId } = req.params;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      if (!threadId) {
        return res.status(400).json({ error: "Thread ID is required" });
      }

      // Validate update data
      const updateSchema = insertThreadSubscriptionSchema.partial().omit({ userId: true, threadId: true });
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid subscription update data", details: result.error });
      }

      const updatedSubscription = await storage.updateThreadSubscription(userId, threadId, result.data);
      if (!updatedSubscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      return res.json(updatedSubscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ===== NOTIFICATION ROUTES =====
  
  // Get user's notifications
  app.get("/api/users/:id/notifications", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const includeRead = req.query.includeRead === "true";

      const notifications = await storage.getUserNotifications(userId, limit, includeRead);
      return res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get unread notification count
  app.get("/api/users/:id/notifications/count", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const count = await storage.countUnreadNotifications(userId);
      return res.json({ userId, unreadCount: count });
    } catch (error) {
      console.error("Error counting notifications:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Mark a notification as read
  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      await storage.markNotificationAsRead(notificationId);
      return res.status(204).end();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Mark all notifications as read for a user
  app.patch("/api/users/:id/notifications/read-all", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      await storage.markAllNotificationsAsRead(userId);
      return res.status(204).end();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete a notification
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      await storage.deleteNotification(notificationId);
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ===== REPUTATION LEVELS ROUTES =====
  
  // Get all reputation levels
  app.get("/api/reputation-levels", async (req, res) => {
    try {
      const levels = await storage.getReputationLevels();
      return res.json(levels);
    } catch (error) {
      console.error("Error fetching reputation levels:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ===== ACHIEVEMENT ROUTES =====
  
  // Get all achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const includeHidden = req.query.includeHidden === "true";
      const achievements = await storage.getAchievements(includeHidden);
      return res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get a specific achievement
  app.get("/api/achievements/:id", async (req, res) => {
    try {
      const achievementId = parseInt(req.params.id);
      if (isNaN(achievementId)) {
        return res.status(400).json({ error: "Invalid achievement ID" });
      }
      
      const achievement = await storage.getAchievement(achievementId);
      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      
      return res.json(achievement);
    } catch (error) {
      console.error("Error fetching achievement:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get user's achievements
  app.get("/api/users/:id/achievements", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const achievements = await storage.getUserAchievements(userId);
      return res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update achievement progress
  app.post("/api/users/:id/achievements/:achievementId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const achievementId = parseInt(req.params.achievementId);
      const { progress } = req.body;
      
      if (isNaN(userId) || isNaN(achievementId)) {
        return res.status(400).json({ error: "Invalid ID parameter" });
      }
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ error: "Progress must be a number between 0 and 100" });
      }
      
      const userAchievement = await storage.updateAchievementProgress(userId, achievementId, progress);
      if (!userAchievement) {
        return res.status(404).json({ error: "User or achievement not found" });
      }
      
      return res.json(userAchievement);
    } catch (error) {
      console.error("Error updating achievement progress:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ===== USER STATS ROUTES =====
  
  // Get user stats
  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const stats = await storage.getUserStats(userId);
      if (!stats) {
        // If no stats exist yet, return empty stats
        return res.json({
          userId,
          postsCreated: 0,
          threadsCreated: 0,
          postsRepliedTo: 0,
          imagesUploaded: 0,
          reactionsReceived: 0,
          totalViews: 0,
          reputationPoints: 0,
          karmaPoints: 0,
          lastUpdated: new Date()
        });
      }
      
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Increment a stat (for internal use)
  app.post("/api/users/:id/stats/increment", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const { field, amount = 1 } = req.body;
      
      if (!field || typeof field !== 'string') {
        return res.status(400).json({ error: "Field name is required" });
      }
      
      // Validate the field name to prevent SQL injection
      const validFields = [
        'postsCreated', 'threadsCreated', 'postsRepliedTo', 
        'imagesUploaded', 'reactionsReceived', 'totalViews',
        'reputationPoints', 'karmaPoints'
      ] as const;
      
      if (!validFields.includes(field as any)) {
        return res.status(400).json({ error: "Invalid field name" });
      }
      
      await storage.incrementUserStats(
        userId, 
        field as keyof Omit<UserStats, 'id' | 'userId' | 'lastUpdated'>, 
        amount
      );
      
      // Get updated stats
      const updatedStats = await storage.getUserStats(userId);
      return res.json(updatedStats);
    } catch (error) {
      console.error("Error incrementing user stats:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create an HTTP server
  const httpServer = createServer(app);
  
  // ===== GPT-IN-THE-MIDDLE ROUTES =====
  
  // Process user input through GPT-4o
  app.post("/api/gpt-process", async (req, res) => {
    try {
      const { userInput, context, threadId, username } = req.body;
      
      if (!userInput || typeof userInput !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Please provide your message text." 
        });
      }
      
      // Process the input through GPT-4o
      const processedResponse = await processUserInput(
        userInput,
        context || `This is a message in thread #${threadId || 'unknown'}`,
        username
      );
      
      return res.status(200).json({
        success: true,
        originalText: processedResponse.originalIntent,
        processedText: processedResponse.content,
        sentiment: processedResponse.sentimentScore,
        topics: processedResponse.topicTags
      });
    } catch (error) {
      console.error("Error in GPT-in-the-middle processing:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to process your message. Please try again."
      });
    }
  });
  
  // ===== NOSTR AUTHENTICATION ENDPOINTS =====
  
  // Validate a Nostr key
  app.post("/api/auth/validate-nostr-key", async (req, res) => {
    try {
      const { pubkey } = req.body;
      
      if (!pubkey || typeof pubkey !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Please provide a valid Nostr public key."
        });
      }
      
      // Check if this is a valid Nostr pubkey format
      if (!/^[0-9a-f]{64}$/.test(pubkey)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Nostr public key format."
        });
      }
      
      // Check if a user exists with this pubkey
      let user = await storage.getUserByNostrPubkey(pubkey);
      
      // If no user exists, create one
      if (!user) {
        // Generate a unique username based on pubkey
        const shortPubkey = pubkey.substring(0, 6);
        const username = `nostr_${shortPubkey}`;
        
        user = await storage.createUser({
          username,
          password: "", // No password for Nostr users
          nostrPubkey: pubkey,
          displayName: username,
          avatar: null,
        });
      } else {
        // Update last seen
        await storage.updateLastSeen(user.id);
      }
      
      return res.status(200).json({
        success: true,
        message: "Nostr identity verified",
        username: user.username,
        userId: user.id,
        pubkey
      });
    } catch (error) {
      console.error("Error validating Nostr key:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Internal server error validating Nostr key."
      });
    }
  });
  
  // ===== CRYPTO TOKEN ANALYSIS ROUTES =====
  
  // Get token analysis for a given contract address
  app.get("/api/token/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      
      // Call Moralis API to get token information
      const tokenAnalysis = await getTokenAnalysis(address);
      
      if (tokenAnalysis.error) {
        return res.status(404).json({ error: tokenAnalysis.error });
      }
      
      return res.json(tokenAnalysis);
    } catch (error) {
      console.error("Error fetching token analysis:", error);
      return res.status(500).json({ error: "Failed to fetch token data" });
    }
  });

  // Setup WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'subscribe') {
          // Subscribe to profile updates or reputation changes
          console.log(`Client subscribed to: ${data.topic}`);
        }
      } catch (error) {
        console.error('Error processing websocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
