import type { Express } from "express";
import { log } from "./vite";

export function registerRoutes(app: Express) {
  // Test endpoint
  app.get('/api/test', (_req, res) => {
    log('Test endpoint hit');
    res.json({ message: 'API is working' });
  });
}
