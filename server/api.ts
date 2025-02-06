import express from "express";
import cors from "cors";
import { log } from "./vite";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/config', (_req, res) => {
  log('Config endpoint hit');
  const apiKey = process.env.BASESCAN_API_KEY;
  log(`Config request received. API Key present: ${Boolean(apiKey)}`);
  
  if (!apiKey) {
    log('WARNING: BASESCAN_API_KEY is not set in environment');
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.json({ basescanApiKey: apiKey });
  log('Config response sent');
});

const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
  log(`API server running on port ${PORT}`);
}); 