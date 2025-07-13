// Define supported assets
export const SUPPORTED_ASSETS = {
  ETH: {
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    decimals: 18
  },
  USDC: {
    symbol: 'USDC',
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    decimals: 6
  },
  cbBTC: {
    symbol: 'cbBTC',
    address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
    decimals: 8
  }
} as const;

export type SupportedAsset = keyof typeof SUPPORTED_ASSETS;

// Helper functions
export const getAssetAddress = (asset: SupportedAsset): string => {
  // Special case for ETH as it doesn't follow the same pattern
  if (asset === 'ETH') 
    return 'BASE.ETH';
  return `BASE.${asset}-${SUPPORTED_ASSETS[asset].address.toUpperCase()}`;
};

// Format helpers
export const formatBTCAmount = (amount: string): string => {
  const btcAmount = Number(amount) / 1e8; // Convert from sats to BTC
  return btcAmount.toFixed(8);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}; 