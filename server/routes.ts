import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Since we're using the Nostr protocol, most of our app functionality
// is client-side and communicates directly with Nostr relays.
// The backend is minimal and mainly serves the static files.

export async function registerRoutes(app: Express): Promise<Server> {
  // These routes will be used for any potential backend functionality
  // that we might need in the future, such as image uploads.
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Create an HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
