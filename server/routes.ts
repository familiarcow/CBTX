import type { Express } from "express";
import { log } from "./vite.js";

export function registerRoutes(app: Express) {
  // Webhook endpoint for toast notifications (with built-in JSON parsing)
  app.post('/api/webhook', (req, res) => {
    let body = '';
    
    // Parse JSON manually for webhook requests
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        log('Webhook received:', {
          headers: req.headers,
          body: parsedBody,
          timestamp: new Date().toISOString()
        });

        const { type, data, userId, messageId } = parsedBody;

        // Handle different webhook event types
        switch (type) {
          case 'transaction_status':
            log(`Transaction status update: ${data?.status} for tx: ${data?.txHash}`);
            break;
          
          case 'miniapp_interaction':
            log(`Mini App interaction: ${data?.action} by user: ${userId}`);
            break;
          
          case 'swap_update':
            log(`Swap update: ${data?.status} for swap: ${data?.swapId}`);
            break;
          
          case 'error_notification':
            log(`Error notification: ${data?.message} for user: ${userId}`);
            break;
          
          default:
            log(`Unknown webhook type: ${type}`);
        }

        // Return JSON response
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ 
          success: true, 
          message: 'Webhook processed successfully',
          messageId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        log('Error processing webhook:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error processing webhook' 
        });
      }
    });
  });

  // GET endpoint for webhook verification/health check
  app.get('/api/webhook', (_req, res) => {
    log('Webhook health check');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
      status: 'active',
      endpoint: '/api/webhook',
      methods: ['POST', 'GET'],
      timestamp: new Date().toISOString()
    });
  });

  // Temporary redirect for Farcaster manifest to hosted version
  app.get('/.well-known/farcaster.json', (_req, res) => {
    log('Redirecting /.well-known/farcaster.json to Farcaster hosted manifest');
    res.redirect(307, 'https://api.farcaster.xyz/miniapps/hosted-manifest/0198765d-dab1-f0e0-0d7b-cb7302c31828');
  });

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
