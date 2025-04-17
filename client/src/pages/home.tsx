import { useEffect, useState } from 'react';
import { useWeb3 } from "@/lib/web3";
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

// Import utilities
import { SupportedAsset, getAssetAddress } from "@/lib/constants";
import { handleTransaction } from "@/lib/transaction";

export default function Home() {
  const { account, web3 } = useWeb3();
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-grow">
        <LogoHeader />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {!account && <Landing />}

          {account && (
            <>
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
            </>
          )}
        </motion.div>
      </div>
      <Footer />
      <ToastController />
    </div>
  );
}
