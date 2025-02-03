import { useQuery } from '@tanstack/react-query';

interface Pool {
  asset: string;
  asset_tor_price: string;
  // Add other pool properties as needed
}

export function usePools() {
  const query = useQuery({
    queryKey: ['thorchain-pools'],
    queryFn: async () => {
      console.log('Fetching THORChain pools data...');
      const response = await fetch('https://thornode.ninerealms.com/thorchain/pools', {
        headers: {
          'x-client-id': 'cbbtc-exchange'
        }
      });
      
      const pools: Pool[] = await response.json();
      return pools;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  return query;
} 