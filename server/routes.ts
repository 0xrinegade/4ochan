import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { 
  insertUserSchema, insertBadgeSchema, insertUserBadgeSchema, 
  insertReputationLogSchema, insertFollowerSchema 
} from '@shared/schema';

// Since we're using the Nostr protocol for content,
// these backend routes handle user profiles and reputation systems

import { authenticateWithAI, generateAIResponse } from "./openai";

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

  // Create an HTTP server
  const httpServer = createServer(app);
  
  // ===== AI AUTHENTICATION ROUTES =====
  
  // AI-powered login endpoint
  app.post("/api/auth/ai-login", async (req, res) => {
    try {
      const { loginText } = req.body;
      
      if (!loginText || typeof loginText !== 'string' || loginText.trim().length < 25) {
        return res.status(400).json({ 
          success: false, 
          message: "Please provide thoughtful text of at least 25 characters." 
        });
      }
      
      const authResult = await authenticateWithAI(loginText);
      
      if (authResult.success && authResult.username) {
        // Check if user exists, otherwise create them
        let user = await storage.getUserByUsername(authResult.username);
        
        if (!user) {
          // Create a new user with the AI-generated username
          user = await storage.createUser({
            username: authResult.username,
            password: "ai-auth-" + Math.random().toString(36).substring(2, 15), // Generate a random password
            nostrPubkey: "", // Empty for AI-generated users
            displayName: authResult.username,
            avatar: null,
            isAdmin: false,
            isModerator: false,
            isVerified: false,
          });
        } else {
          // Update last seen
          await storage.updateLastSeen(user.id);
        }
        
        // Set up a simple session (in production, use proper session management)
        // req.session.userId = user.id;
        
        return res.status(200).json({
          success: true,
          message: authResult.message,
          username: user.username,
          userId: user.id
        });
      }
      
      return res.status(401).json({
        success: false,
        message: authResult.message || "Authentication failed."
      });
    } catch (error) {
      console.error("Error in AI login:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Internal server error during login."
      });
    }
  });
  
  // AI login hint endpoint
  app.post("/api/auth/login-hint", async (req, res) => {
    try {
      const { loginText } = req.body;
      
      if (!loginText || typeof loginText !== 'string') {
        return res.status(400).json({ hint: "Please provide some text to get a hint." });
      }
      
      const hint = await generateAIResponse(
        `The user tried to log in with this text but was rejected: "${loginText.substring(0, 100)}...". 
        Give them a hint about why they might have been rejected and what to write instead. 
        Keep it brief and helpful.`
      );
      
      return res.json({ hint });
    } catch (error) {
      console.error("Error generating login hint:", error);
      return res.status(500).json({ hint: "Error generating hint. Please try different input." });
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
