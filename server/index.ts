import express from "express";
import { setupVite } from "./vite";
import { createServer } from "http";
import { log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.get('/health', (_req: any, res: any) => {
  res.send('OK');
});

if (process.env.NODE_ENV !== 'production') {
  log("Setting up development server...");
  registerRoutes(app);

  setupVite(app, server).then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      log(`Development server running on port ${PORT}`);
    }).on('error', (err) => {
      log(`Failed to start server: ${err.message}`);
      process.exit(1);
    });
  }).catch((err) => {
    log(`Failed to setup Vite: ${err.message}`);
    process.exit(1);
  });
} else {
  registerRoutes(app);
  log("Setting up production server...");
  const distPath = path.resolve(__dirname, "../dist/public");

  // Serve static files first
  app.use(express.static(distPath));

  // Register API routes
  registerRoutes(app);

  // Serve index.html for all other routes (SPA fallback)
  app.get("*", (_req: any, res: any) => {
    try {
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          log(`Error sending index.html: ${err}`);
          res.status(500).send('Error loading application');
        }
      });
    } catch (err) {
      log(`Failed to serve index.html: ${err}`);
      res.status(500).send('Error loading application');
    }
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    log(`Production server running on port ${PORT}`);
  }).on('error', (err) => {
    log(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
}