import type { Express } from "express";
import { createServer, type Server } from "http";
import { log } from "./vite";

export function registerRoutes(app: Express): Server {
  // Test endpoint
  app.get('/api/test', (_req, res) => {
    log('Test endpoint hit');
    res.json({ message: 'API is working' });
  });

  return createServer(app);
}
