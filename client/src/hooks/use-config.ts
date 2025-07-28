import { useQuery } from '@tanstack/react-query';
import { setApiKey } from '@/lib/basescan';
import { useEffect } from 'react';
import { usePools } from './use-pools';

interface Config {
  basescanApiKey: string;
}

async function fetchConfig(): Promise<Config> {
  console.log('Starting fetchConfig...');
  
  try {
    // First try to get API key from server API (for production)
    try {
      console.log('Fetching config from server API...');
      const response = await fetch('/api/config');
      if (response.ok) {
        const serverConfig = await response.json();
        if (serverConfig.basescanApiKey) {
          setApiKey(serverConfig.basescanApiKey);
          console.log('API key set from server API successfully');
          return { basescanApiKey: serverConfig.basescanApiKey };
        }
      }
      console.log('Server API did not provide API key, trying environment variable...');
    } catch (serverError) {
      console.log('Failed to fetch from server API, trying environment variable...');
    }

    // Fallback to environment variable (for development)
    const apiKey = import.meta.env.VITE_BASESCAN_API_KEY;
    
    // Check for valid API key (not undefined, null, empty string, or the string "undefined")
    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
      console.log('No API key found in environment, using fallback key');
      // Fallback to hardcoded key for development
      const fallbackKey = 'DX2VTXXW393NDGKQREZG9UKR5GWSAJ9A7K';
      setApiKey(fallbackKey);
      return { basescanApiKey: fallbackKey };
    }

    // Set the API key
    setApiKey(apiKey);
    console.log('API key set from environment successfully');
    
    return { basescanApiKey: apiKey };
  } catch (error) {
    console.error('Error in fetchConfig:', error);
    throw error;
  }
}

export function useConfig() {
  const query = useQuery<Config>({
    queryKey: ['config'],
    queryFn: fetchConfig,
    retry: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  console.log('useConfig hook state:', {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasApiKey: !!query.data?.basescanApiKey
  });

  return query;
}

export function useUSDValues() {
  const poolsQuery = usePools();
  
  return useQuery({
    queryKey: ['usd-values'],
    queryFn: () => {
      if (!poolsQuery.data) throw new Error('Pools data not available');

      // Find the pools with more precise matching
      const ethPool = poolsQuery.data.find((pool) => pool.asset === 'BASE.ETH');
      const usdcPool = poolsQuery.data.find((pool) => pool.asset === 'BASE.USDC-0X833589FCD6EDB6E08F4C7C32D4F71B54BDA02913');
      const cbBTCPool = poolsQuery.data.find((pool) => pool.asset === 'BASE.CBBTC-0XCBB7C0000AB88B473B1F5AFD9EF808440EED33BF');

      // Log matched pools
      console.log('Matched pools:', {
        ethPool,
        usdcPool,
        cbBTCPool
      });

      if (!ethPool || !usdcPool || !cbBTCPool) {
        console.warn('Missing pools:', {
          eth: !!ethPool,
          usdc: !!usdcPool,
          cbBTC: !!cbBTCPool
        });
        throw new Error('Failed to find required pools');
      }

      const prices = {
        ETH: Number(ethPool.asset_tor_price) / 1e8,
        USDC: Number(usdcPool.asset_tor_price) / 1e8,
        cbBTC: Number(cbBTCPool.asset_tor_price) / 1e8
      };

      console.log('Final prices object:', prices);
      
      return prices;
    },
    enabled: poolsQuery.data !== undefined,
    staleTime: 10000,
  });
} 