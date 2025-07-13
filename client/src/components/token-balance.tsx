import React from 'react';
import { useEffect, useState } from "react";
import { useWeb3 } from "@/lib/web3";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTokenBalance, getEthBalance } from "@/lib/basescan";
import { formatUnits } from "ethers";
import { useConfig, useUSDValues } from '@/hooks/use-config';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { SUPPORTED_ASSETS } from "@/lib/constants";

const TOKEN_ADDRESSES = {
  ETH: SUPPORTED_ASSETS.ETH.address,
  USDC: SUPPORTED_ASSETS.USDC.address,
  cbBTC: SUPPORTED_ASSETS.cbBTC.address,
} as const;

const TOKEN_DECIMALS = {
  ETH: SUPPORTED_ASSETS.ETH.decimals,
  USDC: SUPPORTED_ASSETS.USDC.decimals,
  cbBTC: SUPPORTED_ASSETS.cbBTC.decimals,
} as const;

interface TokenBalanceProps {
  symbol: keyof typeof TOKEN_ADDRESSES;
  isSelected?: boolean;
  onSelect?: () => void;
  logo?: string;
  chainLogo?: string;
  refreshKey?: number;
  canLoad?: boolean;
  onLoadingComplete?: (symbol: keyof typeof TOKEN_ADDRESSES) => void;
}

export function TokenBalance({ 
  symbol, 
  isSelected, 
  onSelect, 
  logo, 
  chainLogo, 
  refreshKey = 0,
  canLoad = true,
  onLoadingComplete
}: TokenBalanceProps) {
  const { data: config, isLoading: configLoading } = useConfig();
  const { data: prices, isLoading: pricesLoading, isError: pricesError } = useUSDValues();
  const { account } = useWeb3();
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Add debug logging
  console.log('TokenBalance Debug:', {
    symbol,
    hasAccount: !!account,
    configLoading,
    hasConfig: !!config,
    pricesLoading,
    pricesError,
    hasPrices: !!prices,
    canLoad,
    hasLoaded
  });

  // Calculate USD value
  const getUSDValue = () => {
    if (!prices || !balance) return null;
    
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return null;

    const usdValue = (() => {
      switch (symbol) {
        case 'ETH':
          return numBalance * prices.ETH;
        case 'USDC':
          return numBalance * prices.USDC;
        case 'cbBTC':
          return numBalance * prices.cbBTC;
        default:
          return null;
      }
    })();

    console.log(`USD Value for ${symbol}:`, {
      balance: numBalance,
      price: prices[symbol],
      usdValue,
    });

    return usdValue;
  };

  // Fetch balance when account, symbol, config, canLoad, or refreshKey changes
  useEffect(() => {
    async function fetchBalance() {
      console.log('fetchBalance running:', {
        symbol,
        hasConfig: Boolean(config),
        hasAccount: Boolean(account),
        canLoad,
        hasLoaded,
        refreshKey
      });

      // Don't fetch if we can't load yet, or if we already loaded (unless refresh triggered)
      if (!canLoad || !account || (hasLoaded && refreshKey === 0)) {
        return;
      }

      // If config is not available, show a more helpful error
      if (!config) {
        setError('API key not configured');
        setHasLoaded(true);
        onLoadingComplete?.(symbol);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        let rawBalance;

        if (symbol === 'ETH') {
          rawBalance = await getEthBalance(account);
        } else {
          rawBalance = await getTokenBalance(TOKEN_ADDRESSES[symbol], account);
        }

        // Format with proper decimals
        const formattedBalance = formatUnits(rawBalance, TOKEN_DECIMALS[symbol]);
        
        // Format display with appropriate precision
        const precision = symbol === 'USDC' ? 2 : 6; // 2 decimals for USDC, 6 for others
        const displayBalance = Number(formattedBalance).toFixed(precision);
        
        setBalance(displayBalance);
        setError(null);
        setHasLoaded(true);
        
        // Notify parent that loading is complete
        onLoadingComplete?.(symbol);
      } catch (error) {
        console.error(`Error fetching ${symbol} balance:`, error);
        setBalance('0');
        
        // Show more user-friendly error messages
        let errorMessage = 'Failed to fetch balance';
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorMessage = 'API key issue';
          } else if (error.message.includes('rate limit')) {
            errorMessage = 'Rate limited';
          } else if (error.message.includes('network')) {
            errorMessage = 'Network error';
          } else {
            errorMessage = error.message;
          }
        }
        
        setError(errorMessage);
        setHasLoaded(true);
        
        // Still notify completion even on error to allow next asset to load
        onLoadingComplete?.(symbol);
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [account, symbol, config, canLoad, refreshKey, onLoadingComplete]);

  // Reset hasLoaded when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      setHasLoaded(false);
    }
  }, [refreshKey]);

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 rounded-2xl hover:scale-[1.02] hover:shadow-md",
        isSelected 
          ? "border-2 border-[#0052FF] shadow-[0_0_0_2px_rgba(0,82,255,0.1)] bg-white" 
          : "border border-gray-200 hover:border-[#0052FF]/30 bg-white/80",
      )}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <img src={logo} alt={symbol} className="h-6 w-6" />
            {chainLogo && (
              <img 
                src={chainLogo} 
                alt="chain" 
                className="h-4 w-4 absolute -bottom-1 -right-1"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">{symbol}</span>
            {loading && (
              <Loader2 className="h-3 w-3 text-[#0052FF] animate-spin" />
            )}
          </div>
        </div>
        
        {!canLoad ? (
          <div className="space-y-2">
            <div className="text-xl font-semibold text-gray-400">
              Waiting...
            </div>
            <div className="text-sm text-gray-400">
              Loading in sequence
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24 mt-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : error ? (
          <div className="space-y-2">
            <div className="text-xl font-semibold text-red-500">
              Error
            </div>
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xl font-semibold text-gray-900">
              {balance}
            </div>
            {pricesLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <div className="text-sm font-medium text-gray-500">
                ${getUSDValue()?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) ?? '0.00'}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
