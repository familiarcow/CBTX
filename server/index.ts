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

app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.get('/health', (_req, res) => {
  res.send('OK');
});

if (process.env.NODE_ENV !== 'production') {
  log("Setting up development server...");
  registerRoutes(app);
  
  setupVite(app, server).then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
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
  log("Setting up production server...");
  const distPath = path.resolve(__dirname, '../client');
  app.use(express.static(distPath));
  
  registerRoutes(app);
  
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    log(`Production server running on port ${PORT}`);
  }).on('error', (err) => {
    log(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
}
