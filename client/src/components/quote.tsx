import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import type { QuoteResponse } from "@/lib/thorchain";
import { calculateMinOutput } from "@/lib/thorchain";
import { getAssetLogo, parseAssetId, getChainLogo } from "@/lib/asset-utils";

// Import logos
import btcLogo from '../../images/btc-logo.svg';
import ethLogo from '../../images/eth-logo.svg';
import usdcLogo from '../../images/usd-coin-usdc-logo.svg';
import cbbtcLogo from '../../images/cbbtc-logo.svg';

interface QuoteProps {
  quote: QuoteResponse;
  destinationAsset: string;
  selectedAsset: 'ETH' | 'USDC' | 'cbBTC';
  isApproving: boolean;
  isSending: boolean;
  onSubmit: () => void;
}

export function Quote({ 
  quote, 
  destinationAsset, 
  selectedAsset,
  isApproving,
  isSending,
  onSubmit 
}: QuoteProps) {
  // Format BTC amount
  const formatBTCAmount = (amount: string) => {
    const btcAmount = Number(amount) / 1e8; // Convert from sats to BTC
    return btcAmount.toFixed(8);
  };

  // Format time in minutes:seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAssetImageSrc = (asset: 'ETH' | 'USDC' | 'cbBTC') => {
    switch (asset) {
      case 'ETH': return ethLogo;
      case 'USDC': return usdcLogo;
      case 'cbBTC': return cbbtcLogo;
    }
  };

  const getAssetAddress = (asset: 'ETH' | 'USDC' | 'cbBTC') => {
    // Special case for ETH as it doesn't follow the same pattern
    if (asset === 'ETH') 
      return 'BASE.ETH';
    
    return `BASE.${asset}-${SUPPORTED_ASSETS[asset].address.toUpperCase()}`;
  };

  // Define supported assets
  const SUPPORTED_ASSETS = {
    ETH: {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000', // Native ETH
      decimals: 18
    },
    USDC: {
      symbol: 'USDC',
      address: '0X833589FCD6EDB6E08F4C7C32D4F71B54BDA02913',
      decimals: 6
    },
    cbBTC: {
      symbol: 'cbBTC',
      address: '0XCBB7C0000AB88B473B1F5AFD9EF808440EED33BF',
      decimals: 8
    }
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-white/50">
          <CardTitle>Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-gray-600 font-medium mb-2">Expected Output</div>
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-[#0052FF]">
              {formatBTCAmount(quote.expected_amount_out)}
              <div className="relative">
                <img 
                  src={getAssetLogo(destinationAsset, btcLogo)} 
                  alt={parseAssetId(destinationAsset).name} 
                  className="h-6 w-6"
                />
                <img 
                  src={getChainLogo(parseAssetId(destinationAsset).chain)}
                  alt={parseAssetId(destinationAsset).chain}
                  className="h-4 w-4 absolute -bottom-1 -right-1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-gray-600 font-medium">Minimum Output</div>
            <div className="font-semibold text-orange-500 flex items-center gap-2">
              {formatBTCAmount(calculateMinOutput(quote.expected_amount_out, 300))}
              <div className="relative">
                <img 
                  src={getAssetLogo(destinationAsset, btcLogo)} 
                  alt={parseAssetId(destinationAsset).name} 
                  className="h-4 w-4"
                />
                <img 
                  src={getChainLogo(parseAssetId(destinationAsset).chain)}
                  alt={parseAssetId(destinationAsset).chain}
                  className="h-3 w-3 absolute -bottom-1 -right-1"
                />
              </div>
            </div>
            
            <div className="text-gray-600 font-medium">Estimated Time</div>
            <div className="font-semibold flex items-center gap-2">
              ~{Math.ceil(quote.total_swap_seconds / 60)} minutes
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img 
                    src={getAssetLogo(getAssetAddress(selectedAsset), getAssetImageSrc(selectedAsset))} 
                    alt={selectedAsset} 
                    className="h-4 w-4" 
                  />
                  <img 
                    src={getChainLogo(parseAssetId(getAssetAddress(selectedAsset)).chain)}
                    alt={parseAssetId(getAssetAddress(selectedAsset)).chain}
                    className="h-3 w-3 absolute -bottom-1 -right-1"
                  />
                </div>
                <span className="mx-1">→</span>
                <div className="relative">
                  <img 
                    src={getAssetLogo(destinationAsset, btcLogo)} 
                    alt={parseAssetId(destinationAsset).name} 
                    className="h-4 w-4"
                  />
                  <img 
                    src={getChainLogo(parseAssetId(destinationAsset).chain)}
                    alt={parseAssetId(destinationAsset).chain}
                    className="h-3 w-3 absolute -bottom-1 -right-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={onSubmit}
              disabled={isApproving || isSending}
              className="w-full bg-gradient-to-r from-[#F2A900] to-[#F4B721] hover:from-[#F4B721] hover:to-[#F2A900] text-white font-semibold py-6 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving 
                ? "Approving..." 
                : isSending 
                  ? "Sending Transaction..." 
                  : "Send Transaction"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 