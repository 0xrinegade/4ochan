import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try to use port 5001 to avoid conflicts
  const port = 5001;
  
  log(`Attempting to start server on port ${port}...`);
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  })
  .on('error', (err: any) => {
    log(`Failed to start server: ${err.message}`);
    
    // Try a different port if the current one is in use
    if (err.code === 'EADDRINUSE') {
      const alternatePort = port + 1;
      log(`Port ${port} is in use, trying port ${alternatePort}...`);
      
      server.listen({
        port: alternatePort,
        host: "0.0.0.0",
        reusePort: true,
      })
      .on('error', (innerErr: any) => {
        log(`Failed to start server on alternate port: ${innerErr.message}`);
      })
      .on('listening', () => {
        log(`serving on alternate port ${alternatePort}`);
      });
    }
  })
  .on('listening', () => {
    log(`serving on port ${port}`);
  });
})();
