// Define logo mapping
export const ASSET_LOGOS: Record<string, string> = {
  'BTC.BTC': new URL('/images/asset-logos/bitcoin-btc-logo.svg', import.meta.url).href,
  'ETH.ETH': new URL('/images/asset-logos/ethereum-eth-logo.svg', import.meta.url).href,
  'BSC.BNB': new URL('/images/asset-logos/binance-coin-bnb-logo.svg', import.meta.url).href,
  'BCH.BCH': new URL('/images/asset-logos/bitcoin-cash-bch-logo.svg', import.meta.url).href,
  'LTC.LTC': new URL('/images/asset-logos/litecoin-ltc-logo.svg', import.meta.url).href,
  'AVAX.AVAX': new URL('/images/asset-logos/avalanche-avax-logo.svg', import.meta.url).href,
  'GAIA.ATOM': new URL('/images/asset-logos/cosmos-atom-logo.svg', import.meta.url).href,
  'DOGE.DOGE': new URL('/images/asset-logos/dogecoin-doge-logo.svg', import.meta.url).href,
  'THOR.RUNE': new URL('/images/asset-logos/RUNE-ICON.svg', import.meta.url).href,
  'THOR.RUJI': new URL('/images/asset-logos/RUJI.svg', import.meta.url).href,
  'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48': new URL('/images/asset-logos/usd-coin-usdc-logo.svg', import.meta.url).href,
  'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7': new URL('/images/asset-logos/tether-usdt-logo.svg', import.meta.url).href,
  'ETH.WBTC-0X2260FAC5E5542A773AA44FBCFEDF7C193BC2C599': new URL('/images/asset-logos/wrapped-bitcoin-wbtc-logo.svg', import.meta.url).href,
  'AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E': new URL('/images/asset-logos/usd-coin-usdc-logo.svg', import.meta.url).href,
  'AVAX.USDT-0X9702230A8EA53601F5CD2DC00FDBC13D4DF4A8C7': new URL('/images/asset-logos/tether-usdt-logo.svg', import.meta.url).href,
  'BSC.USDC-0X8AC76A51CC950D9822D68B83FE1AD97B32CD580D': new URL('/images/asset-logos/usd-coin-usdc-logo.svg', import.meta.url).href,
  'BSC.USDT-0X55D398326F99059FF775485246999027B3197955': new URL('/images/asset-logos/tether-usdt-logo.svg', import.meta.url).href,
  'BSC.TWT-0X4B0F1812E5DF2A09796481FF14017E6005508003': new URL('/images/asset-logos/twt-logo.png', import.meta.url).href,
  'BSC.BUSD-0XE9E7CEA3DEDCA5984780BAFC599BD69ADD087D56': new URL('/images/asset-logos/binance-usd-busd-logo.svg', import.meta.url).href,
  'BSC.BTCB-0X7130D2A12B9BCBFAE4F2634D864A1EE1CE3EAD9C': new URL('/images/asset-logos/bitcoin-btc-logo.svg', import.meta.url).href,
  'ETH.DAI-0X6B175474E89094C44DA98B954EEDEAC495271D0F': new URL('/images/asset-logos/multi-collateral-dai-dai-logo.svg', import.meta.url).href,
  'ETH.GUSD-0X056FD409E1D7A124BD7017459DFEA2F387B6D5CD': new URL('/images/asset-logos/gemini-dollar-gusd-logo.svg', import.meta.url).href,
  'ETH.LUSD-0X5F98805A4E8BE255A32880FDEC7F6728C6568BA0': new URL('/images/asset-logos/liquity-usd-logo.svg', import.meta.url).href,
  'ETH.USDP-0X8E870D67F660D95D5BE530380D0EC0BD388289E1': new URL('/images/asset-logos/paxos-standard-usdp-logo.svg', import.meta.url).href,
  'ETH.AAVE-0X7FC66500C84A76AD7E9C93437BFC5AC33E2DDAE9': new URL('/images/asset-logos/aave-aave-logo.svg', import.meta.url).href,
  'ETH.LINK-0X514910771AF9CA656AF840DFF83E8264ECF986CA': new URL('/images/asset-logos/chainlink-link-logo.svg', import.meta.url).href,
  'ETH.SNX-0XC011A73EE8576FB46F5E1C5751CA3B9FE0AF2A6F': new URL('/images/asset-logos/synthetix-snx-logo.svg', import.meta.url).href,
  'ETH.FOX-0XC770EEFAD204B5180DF6A14EE197D99D808EE52D': new URL('/images/asset-logos/fox-token-fox-logo.svg', import.meta.url).href,
  'AVAX.SOL-0XFE6B19286885A4F7F55ADAD09C3CD1F906D2478F': new URL('/images/asset-logos/solana-sol-logo.svg', import.meta.url).href,
  'BASE.ETH': new URL('/images/asset-logos/ethereum-eth-logo.svg', import.meta.url).href,
  'BASE.USDC-0X833589FCD6EDB6E08F4C7C32D4F71B54BDA02913': new URL('/images/asset-logos/usd-coin-usdc-logo.svg', import.meta.url).href,
  'BASE.CBBTC-0XCBB7C0000AB88B473B1F5AFD9EF808440EED33BF': new URL('/images/asset-logos/coinbase-wrapped-btc-logo.svg', import.meta.url).href,
  'ETH.DPI-0X1494CA1F11D487C2BBE4543E90080AEBA4BA3C2B': new URL('/images/asset-logos/dpi-logo.png', import.meta.url).href,
  'ETH.THOR-0XA5F2211B9B8170F694421F2046281775E8468044': new URL('/images/asset-logos/thorswap-logo.png', import.meta.url).href,
  'ETH.VTHOR-0X815C23ECA83261B6EC689B60CC4A58B54BC24D8D': new URL('/images/asset-logos/thorswap-logo.png', import.meta.url).href,
  'ETH.XRUNE-0X69FA0FEE221AD11012BAB0FDB45D444D3D2CE71C': new URL('/images/asset-logos/xrune-logo.png', import.meta.url).href,
  'ETH.TGT-0X108A850856DB3F85D0269A2693D896B394C80325': new URL('/images/asset-logos/tgt-logo.png', import.meta.url).href,
  'XRP.XRP': new URL('/images/asset-logos/xrp-xrp-logo.svg', import.meta.url).href,
  'THOR.TCY': new URL('/images/asset-logos/TCY.svg', import.meta.url).href
} as const;

// Define chain logo mapping
export const CHAIN_LOGOS: Record<string, string> = {
  'BTC': new URL('/images/chain-logos/BTC.svg', import.meta.url).href,
  'ETH': new URL('/images/chain-logos/ETH.svg', import.meta.url).href,
  'BSC': new URL('/images/chain-logos/BSC.svg', import.meta.url).href,
  'BCH': new URL('/images/chain-logos/BCH.svg', import.meta.url).href,
  'LTC': new URL('/images/chain-logos/LTC.svg', import.meta.url).href,
  'AVAX': new URL('/images/chain-logos/AVAX.svg', import.meta.url).href,
  'GAIA': new URL('/images/chain-logos/GAIA.svg', import.meta.url).href,
  'DOGE': new URL('/images/chain-logos/DOGE.svg', import.meta.url).href,
  'THOR': new URL('/images/chain-logos/THOR.svg', import.meta.url).href,
  'BASE': new URL('/images/chain-logos/BASE.svg', import.meta.url).href,
  'XRP': new URL('/images/chain-logos/XRP.svg', import.meta.url).href,
  'TRON': new URL('/images/chain-logos/TRON.svg', import.meta.url).href,
} as const;

export interface AssetConfig {
  name: string;
  chain: string;
  logo?: string;
  chainLogo?: string;
  price?: string;
}

/**
 * Get the logo URL for a given asset identifier
 * @param assetId The asset identifier (e.g., 'BTC.BTC', 'BASE.ETH')
 * @param fallbackLogo Optional fallback logo URL if the asset is not found
 * @returns The logo URL for the asset
 */
export function getAssetLogo(assetId: string, fallbackLogo?: string): string {
  return ASSET_LOGOS[assetId] || fallbackLogo || '';
}

/**
 * Get the chain logo URL for a given chain
 * @param chain The chain identifier (e.g., 'BTC', 'BASE')
 * @returns The logo URL for the chain
 */
export function getChainLogo(chain: string): string {
  return CHAIN_LOGOS[chain] || '';
}

/**
 * Parse an asset identifier into its components
 * @param assetId The asset identifier (e.g., 'BTC.BTC', 'BASE.ETH')
 * @returns Object containing the parsed components
 */
export function parseAssetId(assetId: string): AssetConfig {
  const [chain, rest] = assetId.split('.');
  const name = rest.split('-')[0];
  
  return {
    name,
    chain,
    logo: getAssetLogo(assetId),
    chainLogo: getChainLogo(chain)
  };
}

/**
 * Create an asset configuration object from a pool asset
 * @param asset The asset identifier
 * @param status The pool status
 * @returns AssetConfig object if the pool is available, null otherwise
 */
export function createAssetConfig(asset: string, status: string): AssetConfig | null {
  if (status !== 'Available') return null;

  return parseAssetId(asset);
}

/**
 * Format an asset name for display
 * @param assetId The asset identifier
 * @returns Formatted asset name
 */
export function formatAssetDisplay(assetId: string): string {
  const { name, chain } = parseAssetId(assetId);
  return `${name} (${chain})`;
} 