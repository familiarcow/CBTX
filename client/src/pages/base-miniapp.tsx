import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoHeader } from "@/components/logo-header";
import { Balances } from "@/components/balances";
import { SwapPanel } from "@/components/swap-panel";
import { Quote } from "@/components/quote";
import { Track } from "@/components/track";
import { ToastController } from "@/components/toast-controller";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useToast } from "@/hooks/use-toast";
import { handleTransaction } from "@/lib/transaction";
import type { QuoteResponse } from "@/lib/thorchain";
import type { SupportedAsset } from "@/lib/constants";

// Import logos
import baseLogo from '../../images/base-logo.svg';
import btcLogo from '../../images/btc-logo.svg';

function BaseWalletConnect() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 mb-6">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <div className="text-sm text-gray-600">
          Connected: <span className="font-medium text-[#0052FF]">
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </span>
        </div>
      </div>
    );
  }

  const handleConnect = () => {
    // Use the first available connector (injected wallet for Base App)
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm mb-6">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <div className="mb-6 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900 flex items-center justify-center flex-wrap">
            <span className="inline-flex items-center">
              From{" "}
              <img src={baseLogo} alt="Base" className="h-6 w-6 md:h-8 md:w-8 mx-1 md:mx-2" />
              Base
            </span>
            <span className="mx-2">→</span>
            <span className="inline-flex items-center">
              <img src={btcLogo} alt="Bitcoin" className="h-6 w-6 md:h-8 md:w-8 mx-1 md:mx-2" />
              Bitcoin
            </span>
          </h1>
          <p className="text-gray-600 text-center">
            Swap your Base assets to Bitcoin and other chains
          </p>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-md"
        >
          <Button
            onClick={handleConnect}
            className="w-full bg-[#0052FF] hover:bg-[#0039B3] text-white font-semibold py-6 px-8 rounded-xl shadow-lg transition-all duration-300"
          >
            Connect Base Wallet
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}

export default function BaseMiniApp() {
  const { address } = useAccount();
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

  // Track account changes
  useEffect(() => {
    console.log('Base Mini App - Account changed:', {
      hasAccount: !!address,
      accountAddress: address,
      timestamp: new Date().toISOString(),
    });
  }, [address]);

  // Auto-scroll and collapse when quote is received
  useEffect(() => {
    if (quote) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
      setIsSwapCollapsed(true);
    }
  }, [quote]);

  // Force expand swap form when selected asset changes
  useEffect(() => {
    setIsSwapCollapsed(false);
    setQuote(null);
  }, [selectedAsset]);

  // Countdown effect
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
  };

  const handleSwapTransaction = async () => {
    if (!quote || !address) return;

    try {
      setIsApproving(true);
      setIsSending(true);

      await handleTransaction({
        web3: null, // In Wagmi setup, this is handled differently
        account: address,
        quote,
        selectedAsset,
        toast,
        onTxHash: (hash: string) => {
          setThorchainTxId(hash);
        },
        onCountdown: (seconds: number) => {
          setSwapCountdown(seconds);
        },
        onError: (error: any) => {
          setSwapCountdown(null);
          setThorchainTxId(null);
        }
      });

    } catch (error) {
      console.error('Transaction handling error:', error);
    } finally {
      setIsSending(false);
      setIsApproving(false);
    }
  };

  const isAuthenticated = !!address;

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
          {!isAuthenticated && <BaseWalletConnect />}

          {isAuthenticated && (
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
                fromAsset={selectedAsset}
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
                  onSubmit={handleSwapTransaction}
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
      <ToastController />
    </div>
  );
} 