import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenBalance } from "@/components/token-balance";
import { useWeb3 } from "@/lib/web3";
import { LogOut } from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { useBasename } from "@/hooks/use-basename";

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
              onSelect={() => onAssetSelect('ETH')}
            />
            <TokenBalance 
              symbol="USDC" 
              logo={usdcLogo}
              chainLogo={baseLogo}
              isSelected={selectedAsset === 'USDC'}
              onSelect={() => onAssetSelect('USDC')}
            />
            <TokenBalance 
              symbol="cbBTC" 
              logo={cbbtcLogo}
              chainLogo={baseLogo}
              isSelected={selectedAsset === 'cbBTC'}
              onSelect={() => onAssetSelect('cbBTC')}
            />
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
} 