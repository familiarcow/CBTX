import React from 'react';
import { useEffect, useState } from "react";
import { useWeb3 } from "@/lib/web3";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTokenBalance, getEthBalance } from "@/lib/basescan";
import { formatUnits } from "ethers";
import { useConfig, useUSDValues } from '@/hooks/use-config';
import { cn } from "@/lib/utils";

const TOKEN_ADDRESSES = {
  ETH: "0x0000000000000000000000000000000000000000", // Native ETH
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
  cbBTC: "0xcBB7C0000AB88b473b1F5afd9Ef808440eED33bF", // Base cbBTC
} as const;

const TOKEN_DECIMALS = {
  ETH: 18,
  USDC: 6, // USDC uses 6 decimals
  cbBTC: 8,
} as const;

interface TokenBalanceProps {
  symbol: keyof typeof TOKEN_ADDRESSES;
  isSelected?: boolean;
  onSelect?: () => void;
  logo?: string;
  chainLogo?: string;
}

export function TokenBalance({ symbol, isSelected, onSelect, logo, chainLogo }: TokenBalanceProps) {
  const { data: config, isLoading: configLoading } = useConfig();
  const { data: prices, isLoading: pricesLoading, isError: pricesError } = useUSDValues();
  const { account } = useWeb3();
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add debug logging
  console.log('TokenBalance Debug:', {
    symbol,
    hasAccount: !!account,
    configLoading,
    hasConfig: !!config,
    pricesLoading,
    pricesError,
    hasPrices: !!prices,
  });

  console.log('TokenBalance render:', {
    symbol,
    configLoading,
    configError: error,
    hasConfig: Boolean(config),
    account
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

  useEffect(() => {
    async function fetchBalance() {
      console.log('fetchBalance running:', {
        symbol,
        hasConfig: Boolean(config),
        hasAccount: Boolean(account)
      });

      if (!account || !config) {
        setLoading(false);
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
      } catch (error) {
        console.error(`Error fetching ${symbol} balance:`, error);
        setBalance('0');
        setError(error instanceof Error ? error.message : 'Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [account, symbol, config]);

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
          <span className="text-sm font-medium text-gray-600">{symbol}</span>
        </div>
        {loading ? (
          <Skeleton className="h-6 w-24 mt-1" />
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
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
