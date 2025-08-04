# Webhook Toast Notification System

## Overview

FromBase.xyz now includes a comprehensive webhook system for real-time toast notifications. This system allows external services (like Farcaster, Base, or THORChain) to send notification events that trigger toast messages in the user interface.

## Architecture

### Backend Webhook Endpoint
- **URL**: `https://frombase.xyz/api/webhook`
- **Methods**: `POST` (for notifications), `GET` (for health check)
- **Content-Type**: `application/json`

### Frontend Notification Handler
- **Hook**: `useWebhookNotifications()`
- **Integration**: Automatically initialized in `Home` component
- **Toast System**: Integrates with existing `useToast()` hook

## Webhook Event Types

### 1. Transaction Status (`transaction_status`)
Notifies users about blockchain transaction updates.

**Payload Example**:
```json
{
  "type": "transaction_status",
  "data": {
    "status": "success", // "pending" | "success" | "failed"
    "txHash": "0x123abc456def...",
    "chainId": 8453,
    "gasUsed": "21000"
  },
  "userId": "user-123",
  "messageId": "tx-001"
}
```

**Toast Behaviors**:
- ✅ **Success**: Green toast, 5 second duration
- ⏳ **Pending**: Blue toast, 3 second duration  
- ❌ **Failed**: Red destructive toast, 7 second duration

### 2. Swap Update (`swap_update`)
Notifies users about cross-chain swap progress.

**Payload Example**:
```json
{
  "type": "swap_update",
  "data": {
    "status": "completed", // "initiated" | "pending" | "completed" | "failed"
    "fromAsset": "ETH",
    "toAsset": "BTC",
    "swapId": "swap-789",
    "amount": "1.5",
    "fee": "0.01"
  },
  "userId": "user-123",
  "messageId": "swap-001"
}
```

**Toast Behaviors**:
- 🎉 **Completed**: Green celebration toast, 5 seconds
- ❌ **Failed**: Red destructive toast, 7 seconds

### 3. Mini App Interaction (`miniapp_interaction`)
Notifies users about Base Mini App specific events.

**Payload Example**:
```json
{
  "type": "miniapp_interaction",
  "data": {
    "action": "wallet_connected", // "wallet_connected" | "wallet_disconnected" | "permission_granted"
    "walletAddress": "0x742d35cc6bf...",
    "source": "base_app"
  },
  "userId": "user-123",
  "messageId": "miniapp-001"
}
```

**Toast Behaviors**:
- 🔗 **Wallet Connected**: Blue success toast, 3 seconds

### 4. Error Notification (`error_notification`)
Sends error messages to users.

**Payload Example**:
```json
{
  "type": "error_notification",
  "data": {
    "message": "Transaction failed due to insufficient gas",
    "code": "INSUFFICIENT_GAS",
    "severity": "error" // "warning" | "error" | "critical"
  },
  "userId": "user-123",
  "messageId": "error-001"
}
```

**Toast Behaviors**:
- ⚠️ **Error**: Red destructive toast, 7 seconds

## API Endpoints

### POST `/api/webhook`
Receives and processes webhook notifications.

**Request Headers**:
```
Content-Type: application/json
```

**Response Format**:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "messageId": "optional-message-id",
  "timestamp": "2025-08-04T18:41:27.433Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Internal server error processing webhook"
}
```

### GET `/api/webhook`
Health check endpoint for webhook service.

**Response**:
```json
{
  "status": "active",
  "endpoint": "/api/webhook",
  "methods": ["POST", "GET"],
  "timestamp": "2025-08-04T18:41:19.180Z"
}
```

## Frontend Integration

### Development Testing
In development mode, test buttons are available in the top-right corner:

```typescript
// Available test functions
triggerTestNotification('transaction_status', { 
  status: 'success', 
  txHash: '0x123abc...' 
});

triggerTestNotification('swap_update', { 
  status: 'completed', 
  fromAsset: 'ETH', 
  toAsset: 'BTC' 
});

triggerTestNotification('error_notification', { 
  message: 'Test error message' 
});
```

### Production Usage
The `useWebhookNotifications()` hook is automatically initialized and ready to receive webhook events.

## Testing

### Manual Testing
```bash
# Test transaction success
curl -X POST http://localhost:5001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"transaction_status","data":{"status":"success","txHash":"0x123abc"},"userId":"test"}'

# Test swap completion
curl -X POST http://localhost:5001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"swap_update","data":{"status":"completed","fromAsset":"ETH","toAsset":"BTC"},"userId":"test"}'

# Test error notification
curl -X POST http://localhost:5001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"error_notification","data":{"message":"Test error"},"userId":"test"}'

# Health check
curl -X GET http://localhost:5001/api/webhook
```

### Integration Testing
1. Start development server: `npm run dev`
2. Open browser to `http://localhost:5001`
3. Use test buttons in top-right corner (dev mode only)
4. Verify toast notifications appear with correct styling and timing

## Security Considerations

### Rate Limiting
Consider implementing rate limiting for webhook endpoints in production:

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many webhook requests from this IP'
});

app.use('/api/webhook', webhookLimiter);
```

### Authentication
For production, consider adding webhook signature verification:

```typescript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}
```

## Future Enhancements

### Real-time Notifications
Current implementation handles webhook events on page load. Future versions could include:

1. **Server-Sent Events (SSE)**: Real-time push notifications
2. **WebSocket Integration**: Bidirectional real-time communication
3. **Push Notifications**: Browser push notifications for offline users

### Enhanced Event Types
Additional webhook events could include:
- `balance_update`: When user balances change
- `price_alert`: When asset prices hit targets
- `maintenance_notice`: System maintenance notifications
- `security_alert`: Security-related notifications

## Deployment

### Environment Variables
No additional environment variables required for basic webhook functionality.

### Manifest Integration
The webhook system works seamlessly with both:
- 🌐 **Regular Browser**: Standard webhook processing
- 📱 **Base Mini App**: Webhook processing within Mini App context

## Support

For webhook integration support:
1. Check server logs for webhook processing details
2. Use health check endpoint to verify service status
3. Test with development buttons for quick debugging
4. Verify JSON payload format matches expected schema

---

**Status**: ✅ **Active and Ready for Production**

The webhook system is fully implemented and tested, ready to receive notifications from external services like Farcaster, Base, or THORChain to provide real-time user feedback via toast notifications. 