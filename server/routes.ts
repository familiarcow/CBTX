import type { Express } from "express";
import { log } from "./vite.js";

export function registerRoutes(app: Express) {
  // Test endpoint
  app.get('/api/test', (_req, res) => {
    log('Test endpoint hit');
    res.json({ message: 'API is working' });
  });

  // Config endpoint for API keys
  app.get('/api/config', (_req, res) => {
    log('Config endpoint hit');
    let apiKey = process.env.BASESCAN_API_KEY;
    
    // Check for valid API key (not undefined, null, empty string, or the string "undefined")
    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
      log('Environment API key not available, using fallback key');
      // Fallback to hardcoded key for development
      apiKey = 'DX2VTXXW393NDGKQREZG9UKR5GWSAJ9A7K';
    } else {
      log('Using environment API key');
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.json({ basescanApiKey: apiKey });
    log('Config response sent');
  });
}
