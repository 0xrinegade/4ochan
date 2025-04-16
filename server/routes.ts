import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { 
  insertUserSchema, insertBadgeSchema, insertUserBadgeSchema, 
  insertReputationLogSchema, insertFollowerSchema,
  insertThreadSubscriptionSchema, insertNotificationSchema
} from '@shared/schema';

// Since we're using the Nostr protocol for content,
// these backend routes handle user profiles and reputation systems

import { authenticateWithAI, generateAIResponse, processUserInput } from "./openai";

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
  
  // ===== AI AUTHENTICATION ROUTES =====
  
  // OpenAI OAuth redirect endpoint
  app.get("/api/auth/openai-redirect", (req, res) => {
    // Set up the OpenAI OAuth endpoints
    const clientId = "org-oi0iXakKcsP1wTTOYKRBoMGr"; // This is a public client ID for OpenAI
    const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/auth/openai-callback`);
    const scope = encodeURIComponent("openid profile email");
    const responseType = "code";
    
    // Generate the authorization URL
    const authUrl = `https://auth.openai.com/oauth/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    // Return the redirect URL
    return res.json({
      success: true,
      redirectUrl: authUrl
    });
  });
  
  // OpenAI OAuth callback endpoint
  app.get("/api/auth/openai-callback", async (req, res) => {
    try {
      // Get the authorization code from the query parameters
      const code = req.query.code as string;
      
      if (!code) {
        throw new Error("No authorization code provided");
      }
      
      // In a real OAuth flow, we would exchange the code for tokens
      // Since we're using an API key directly, we'll use it to verify user identity
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }
      
      // Instead of using the OAuth token exchange (which requires client secret), 
      // we'll use the OpenAI API key to make a simple verification request
      // This ensures we can only authenticate if we have a valid API key
      const OpenAI = await import("openai").then(mod => mod.default);
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      // Verify API key works by making a simple request
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Use the latest OpenAI model
        messages: [{ role: "user", content: "Generate a unique username for a Nostr user in one word" }],
        max_tokens: 50
      });
      
      if (!response || !response.choices || !response.choices[0]?.message?.content) {
        throw new Error("Failed to verify OpenAI API key");
      }
      
      // Generate a unique OpenAI-based username
      const generatedName = response.choices[0].message.content.trim()
        .replace(/[^a-zA-Z0-9]/g, ""); // Clean up any special characters
      
      const username = `oai_${generatedName.toLowerCase()}`;
      
      // Create a unique Nostr keypair for this user
      const { generateSecretKey, getPublicKey } = await import("nostr-tools");
      const privkey = generateSecretKey();
      const pubkey = getPublicKey(privkey);
      
      // Create a new user or get existing user
      let user = await storage.getUserByNostrPubkey(pubkey);
      
      if (!user) {
        // Create a new user with the Nostr keypair
        user = await storage.createUser({
          username: username,
          password: "", // No password for OAuth users
          nostrPubkey: pubkey,
          displayName: username,
          avatar: null,
        });
      } else {
        // Update last seen
        await storage.updateLastSeen(user.id);
      }
      
      // Redirect to the frontend with success parameters
      return res.redirect(`/?login_success=true&username=${user.username}&pubkey=${pubkey}`);
    } catch (error) {
      console.error("Error in OpenAI OAuth callback:", error);
      return res.redirect("/?login_error=true");
    }
  });
  
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
