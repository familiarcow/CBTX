import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebhookEvent {
  type: 'transaction_status' | 'miniapp_interaction' | 'swap_update' | 'error_notification';
  data: any;
  userId?: string;
  messageId?: string;
  timestamp: string;
}

export function useWebhookNotifications() {
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const handleWebhookEvent = (event: WebhookEvent) => {
    console.log('Webhook event received:', event);

    switch (event.type) {
      case 'transaction_status':
        if (event.data?.status === 'success') {
          toast({
            title: "Transaction Successful! ✅",
            description: `Transaction ${event.data.txHash?.slice(0, 10)}... completed successfully`,
            duration: 5000,
          });
        } else if (event.data?.status === 'failed') {
          toast({
            title: "Transaction Failed ❌",
            description: `Transaction ${event.data.txHash?.slice(0, 10)}... failed`,
            variant: "destructive",
            duration: 7000,
          });
        } else if (event.data?.status === 'pending') {
          toast({
            title: "Transaction Pending ⏳",
            description: `Transaction ${event.data.txHash?.slice(0, 10)}... is being processed`,
            duration: 3000,
          });
        }
        break;

      case 'swap_update':
        if (event.data?.status === 'completed') {
          toast({
            title: "Swap Completed! 🎉",
            description: `Your ${event.data.fromAsset} → ${event.data.toAsset} swap is complete`,
            duration: 5000,
          });
        } else if (event.data?.status === 'failed') {
          toast({
            title: "Swap Failed ❌",
            description: `Your ${event.data.fromAsset} → ${event.data.toAsset} swap failed`,
            variant: "destructive",
            duration: 7000,
          });
        }
        break;

      case 'miniapp_interaction':
        if (event.data?.action === 'wallet_connected') {
          toast({
            title: "Wallet Connected! 🔗",
            description: "Your wallet has been successfully connected",
            duration: 3000,
          });
        }
        break;

      case 'error_notification':
        toast({
          title: "Error ⚠️",
          description: event.data?.message || "An error occurred",
          variant: "destructive",
          duration: 7000,
        });
        break;

      default:
        console.log('Unknown webhook event type:', event.type);
    }
  };

  const connectWebhook = () => {
    // For now, we'll simulate webhook events since we don't have Server-Sent Events set up
    // In a real implementation, this would connect to an SSE endpoint
    console.log('Webhook notifications service initialized');
    isConnectedRef.current = true;
  };

  const disconnectWebhook = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    isConnectedRef.current = false;
  };

  // Manual trigger function for testing
  const triggerTestNotification = (type: WebhookEvent['type'], data: any = {}) => {
    const testEvent: WebhookEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
      messageId: `test-${Date.now()}`
    };
    handleWebhookEvent(testEvent);
  };

  useEffect(() => {
    connectWebhook();
    
    return () => {
      disconnectWebhook();
    };
  }, []);

  return {
    isConnected: isConnectedRef.current,
    triggerTestNotification,
    handleWebhookEvent
  };
} 