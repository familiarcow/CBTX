import express from "express";
import { setupVite } from "./vite";
import { createServer } from "http";
import { log } from "./vite";

const app = express();
const server = createServer(app);

// Setup Vite
if (process.env.NODE_ENV !== 'production') {
  log('Setting up Vite middleware...');
  setupVite(app, server).then(() => {
    const PORT = 5000;
    server.listen(PORT, () => {
      log(`Server running on port ${PORT}`);
    });
  });
} else {
  const PORT = 5000;
  server.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
  });
}
