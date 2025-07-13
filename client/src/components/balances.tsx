import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenBalance } from "@/components/token-balance";
import { useWeb3 } from "@/lib/web3";
import { LogOut } from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { useBasename } from "@/hooks/use-basename";
import { useEffect, useState, useCallback } from "react";
import { refreshBalancesEvent } from "@/lib/transaction";

// Import logos
import baseLogo from '../../images/base-logo.svg';
import ethLogo from '../../images/eth-logo.svg';
import usdcLogo from '../../images/usd-coin-usdc-logo.svg';
import cbbtcLogo from '../../images/cbbtc-logo.svg';

type BalanceProps = {
  selectedAsset: 'ETH' | 'USDC' | 'cbBTC';
  onAssetSelect: (asset: 'ETH' | 'USDC' | 'cbBTC') => void;
};

export function Balances({ selectedAsset, onAssetSelect }: BalanceProps) {
  const { account, web3, disconnect } = useWeb3();
  const { basename, loading: basenameLoading } = useBasename(account as `0x${string}` | null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadingQueue, setLoadingQueue] = useState<Array<'ETH' | 'USDC' | 'cbBTC'>>([]);
  
  // Listen for the refresh-balances event
  useEffect(() => {
    const handleRefreshBalances = () => {
      console.log('Refreshing balances from event trigger');
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('refresh-balances', handleRefreshBalances);
    
    return () => {
      window.removeEventListener('refresh-balances', handleRefreshBalances);
    };
  }, []);

  // Sequential loading management
  const [completedLoads, setCompletedLoads] = useState<Set<string>>(new Set());
  const [canLoadNext, setCanLoadNext] = useState({
    ETH: true,
    USDC: false,
    cbBTC: false
  });

  const handleLoadingComplete = useCallback((symbol: 'ETH' | 'USDC' | 'cbBTC') => {
    setCompletedLoads(prev => {
      const newSet = new Set(prev);
      newSet.add(symbol);
      
      // Update what can load next
      if (symbol === 'ETH') {
        setCanLoadNext(prev => ({ ...prev, USDC: true }));
      } else if (symbol === 'USDC') {
        setCanLoadNext(prev => ({ ...prev, cbBTC: true }));
      }
      
      return newSet;
    });
  }, []);

  const handleEthSelect = useCallback(() => onAssetSelect('ETH'), [onAssetSelect]);
  const handleUsdcSelect = useCallback(() => onAssetSelect('USDC'), [onAssetSelect]);
  const handleCbBtcSelect = useCallback(() => onAssetSelect('cbBTC'), [onAssetSelect]);

  // Reset loading states when account changes
  useEffect(() => {
    if (account) {
      setCompletedLoads(new Set());
      setCanLoadNext({
        ETH: true,
        USDC: false,
        cbBTC: false
      });
    }
  }, [account]);

  if (!account) return null;
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2"
      >
        <a
          href={`https://basescan.org/address/${account}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-white/95 transition-colors"
        >
          <img src={baseLogo} alt="Base" className="h-4 w-4" />
          {basenameLoading ? (
            <span className="text-gray-400">Loading...</span>
          ) : basename ? (
            <span className="text-[#0052FF] font-medium">{basename}</span>
          ) : (
            truncateAddress(account)
          )}
          <span className="sr-only">View on Basescan</span>
        </a>
        <motion.button
          onClick={() => web3 && disconnect()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-white/50">
            <CardTitle>Balances</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <TokenBalance 
              symbol="ETH" 
              logo={ethLogo}
              chainLogo={baseLogo}
              isSelected={selectedAsset === 'ETH'}
              onSelect={handleEthSelect}
              refreshKey={refreshTrigger}
              canLoad={canLoadNext.ETH}
              onLoadingComplete={handleLoadingComplete}
            />
            <TokenBalance 
              symbol="USDC" 
              logo={usdcLogo}
              chainLogo={baseLogo}
              isSelected={selectedAsset === 'USDC'}
              onSelect={handleUsdcSelect}
              refreshKey={refreshTrigger}
              canLoad={canLoadNext.USDC}
              onLoadingComplete={handleLoadingComplete}
            />
            <TokenBalance 
              symbol="cbBTC" 
              logo={cbbtcLogo}
              chainLogo={baseLogo}
              isSelected={selectedAsset === 'cbBTC'}
              onSelect={handleCbBtcSelect}
              refreshKey={refreshTrigger}
              canLoad={canLoadNext.cbBTC}
              onLoadingComplete={handleLoadingComplete}
            />
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
} 