
import express from "express";
import { setupVite } from "./vite";
import { createServer } from "http";
import { log } from "./vite";
import path from "path";
import { registerRoutes } from "./routes";

const app = express();
const server = createServer(app);

if (process.env.NODE_ENV !== 'production') {
  log('Setting up Vite middleware...');
  setupVite(app, server).then(() => {
    const PORT = 5000;
    server.listen(PORT, '0.0.0.0', () => {
      log(`Development server running on port ${PORT}`);
    });
  });
} else {
  // Serve static files in production
  const distPath = path.resolve(__dirname, '../dist/public');
  app.use(express.static(distPath));
  
  // Register API routes
  registerRoutes(app);
  
  // Serve index.html for all other routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const PORT = 5000;
  server.listen(PORT, '0.0.0.0', () => {
    log(`Production server running on port ${PORT}`);
  });
}
