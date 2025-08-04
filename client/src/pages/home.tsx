import { useEffect, useState } from 'react';
import { useWeb3 } from "@/hooks/use-web3-compat";
import { useConfig, useUSDValues } from "@/hooks/use-config";
import { useToast } from "@/hooks/use-toast";
import type { QuoteResponse } from "@/lib/thorchain";
import { motion } from "framer-motion";

// Import components
import { LogoHeader } from "@/components/logo-header";
import { Footer } from "@/components/footer";
import { Landing } from "@/components/landing";
import { Balances } from "@/components/balances";
import { SwapPanel } from "@/components/swap-panel";
import { Quote } from "@/components/quote";
import { Track } from "@/components/track";
import { ToastController } from "@/components/toast-controller";
import { AdaptiveWalletConnect } from "@/components/adaptive-wallet-connect";

// Import utilities
import { SupportedAsset, getAssetAddress } from "@/lib/constants";
import { handleTransaction } from "@/lib/transaction";
import { useWebhookNotifications } from "@/hooks/use-webhook-notifications";

export default function Home() {
  const { account, web3, provider, chainId, connect } = useWeb3();
  const configQuery = useConfig();
  const usdValues = useUSDValues();
  
  // Initialize webhook notifications
  const { triggerTestNotification, handleWebhookEvent } = useWebhookNotifications();

  const { toast } = useToast();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [destinationAsset, setDestinationAsset] = useState<string>('BTC.BTC');
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('ETH');
  const [swapCountdown, setSwapCountdown] = useState<number | null>(null);
  const [thorchainTxId, setThorchainTxId] = useState<string | null>(null);
  const [isSwapCollapsed, setIsSwapCollapsed] = useState(false);
  const [settings, setSettings] = useState({
    slippageBps: 3,
    streamingInterval: 1
  });

  // Add effect to track account changes
  useEffect(() => {
    console.log('Account changed:', {
      hasAccount: !!account,
      accountAddress: account,
      timestamp: new Date().toISOString(),
    });
  }, [account]);

  // Add effect for auto-scrolling and collapsing when quote is received
  useEffect(() => {
    if (quote) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
      // Auto collapse when quote is received
      setIsSwapCollapsed(true);
    }
  }, [quote]);

  // Force expand swap form when selected asset changes
  useEffect(() => {
    setIsSwapCollapsed(false);
    setQuote(null); // Clear existing quote
  }, [selectedAsset]);

  // Add countdown effect
  useEffect(() => {
    if (swapCountdown === null) return;
    
    const timer = setInterval(() => {
      setSwapCountdown(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [swapCountdown]);

  const handleAssetSelect = (asset: SupportedAsset) => {
    setSelectedAsset(asset);
    // Clear existing quote when asset changes
    setQuote(null);
  };

  const handleTransactionSubmit = async () => {
    if (!quote || !web3 || !account) return;

    try {
      setIsSending(true);
      setThorchainTxId(null); // Reset transaction ID
      setSwapCountdown(null); // Reset countdown

      await handleTransaction({
        web3,
        account,
        quote,
        selectedAsset,
        toast,
        onTxHash: (hash) => {
          setThorchainTxId(hash);
        },
        onCountdown: (seconds) => {
          setSwapCountdown(seconds);
        },
        onError: (error) => {
          setSwapCountdown(null); // Reset countdown on error
          setThorchainTxId(null); // Reset transaction ID on error
        }
      });

    } catch (error) {
      console.error('Transaction handling error:', error);
    } finally {
      setIsSending(false);
      setIsApproving(false);
    }
  };

  const isAuthenticated = account;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col relative overflow-hidden"
    >
      {/* Development webhook testing - only show in dev mode */}
      {import.meta.env.DEV && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="text-sm font-semibold mb-2">Webhook Test</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => triggerTestNotification('transaction_status', { 
                status: 'success', 
                txHash: '0x123abc...' 
              })}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Test Success
            </button>
            <button
              onClick={() => triggerTestNotification('swap_update', { 
                status: 'completed', 
                fromAsset: 'ETH', 
                toAsset: 'BTC' 
              })}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Test Swap
            </button>
            <button
              onClick={() => triggerTestNotification('error_notification', { 
                message: 'Test error message' 
              })}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Test Error
            </button>
          </div>
        </div>
      )}

      <LogoHeader />

      {!isAuthenticated && <Landing />}

      {isAuthenticated && web3 && (
        <div className="container mx-auto px-4 py-6 flex-grow">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <Balances 
              selectedAsset={selectedAsset} 
              onAssetSelect={handleAssetSelect} 
            />

            <SwapPanel
              onQuoteReceived={(newQuote, destAsset) => {
                setQuote(newQuote);
                setDestinationAsset(destAsset);
              }}
              fromAsset={getAssetAddress(selectedAsset)}
              settings={settings}
              isSwapCollapsed={isSwapCollapsed}
              onSwapCollapse={setIsSwapCollapsed}
              quote={quote}
              selectedAsset={selectedAsset}
            />

            {quote && (
              <Quote
                quote={quote}
                destinationAsset={destinationAsset}
                selectedAsset={selectedAsset}
                isApproving={isApproving}
                isSending={isSending}
                onSubmit={handleTransactionSubmit}
              />
            )}

            {thorchainTxId && (
              <Track
                thorchainTxId={thorchainTxId}
                swapCountdown={swapCountdown}
              />
            )}
          </motion.div>
        </div>
      )}

      <Footer />
      <ToastController />
    </motion.div>
  );
}
