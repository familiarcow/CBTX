import React from 'react';
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSwapQuote, type QuoteResponse } from "@/lib/thorchain";
import { useWeb3 } from "@/lib/web3";
import { ArrowDown, Package, Settings2, ChevronDown, Check } from "lucide-react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  type AssetConfig, 
  createAssetConfig, 
  parseAssetId 
} from "@/lib/asset-utils";

// Define logo mapping
const ASSET_LOGOS: Record<string, string> = {
  'BTC.BTC': '/images/asset-logos/bitcoin-btc-logo.svg',
  'ETH.ETH': '/images/asset-logos/ethereum-eth-logo.svg',
  'BSC.BNB': '/images/asset-logos/binance-coin-bnb-logo.svg',
  'BCH.BCH': '/images/asset-logos/bitcoin-cash-bch-logo.svg',
  'LTC.LTC': '/images/asset-logos/litecoin-ltc-logo.svg',
  'AVAX.AVAX': '/images/asset-logos/avalanche-avax-logo.svg',
  'GAIA.ATOM': '/images/asset-logos/cosmos-atom-logo.svg',
  'DOGE.DOGE': '/images/asset-logos/dogecoin-doge-logo.svg',
  'THOR.RUNE': '/images/asset-logos/RUNE-ICON.svg',
  'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48': '/images/asset-logos/usd-coin-usdc-logo.svg',
  'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7': '/images/asset-logos/tether-usdt-logo.svg',
  'ETH.WBTC-0X2260FAC5E5542A773AA44FBCFEDF7C193BC2C599': '/images/asset-logos/wrapped-bitcoin-wbtc-logo.svg',
  'AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E': '/images/asset-logos/usd-coin-usdc-logo.svg',
  'AVAX.USDT-0X9702230A8EA53601F5CD2DC00FDBC13D4DF4A8C7': '/images/asset-logos/tether-usdt-logo.svg',
  'BSC.USDC-0X8AC76A51CC950D9822D68B83FE1AD97B32CD580D': '/images/asset-logos/usd-coin-usdc-logo.svg',
  'BSC.USDT-0X55D398326F99059FF775485246999027B3197955': '/images/asset-logos/tether-usdt-logo.svg',
  'BSC.TWT-0X4B0F1812E5DF2A09796481FF14017E6005508003': '/images/asset-logos/twt-logo.png',
  'ETH.DAI-0X6B175474E89094C44DA98B954EEDEAC495271D0F': '/images/asset-logos/multi-collateral-dai-dai-logo.svg',
  'ETH.GUSD-0X056FD409E1D7A124BD7017459DFEA2F387B6D5CD': '/images/asset-logos/gemini-dollar-gusd-logo.svg',
  'ETH.LUSD-0X5F98805A4E8BE255A32880FDEC7F6728C6568BA0': '/images/asset-logos/liquity-usd-logo.svg',
  'ETH.USDP-0X8E870D67F660D95D5BE530380D0EC0BD388289E1': '/images/asset-logos/paxos-standard-usdp-logo.svg',
  'ETH.AAVE-0X7FC66500C84A76AD7E9C93437BFC5AC33E2DDAE9': '/images/asset-logos/aave-aave-logo.svg',
  'ETH.LINK-0X514910771AF9CA656AF840DFF83E8264ECF986CA': '/images/asset-logos/chainlink-link-logo.svg',
  'ETH.SNX-0XC011A73EE8576FB46F5E1C5751CA3B9FE0AF2A6F': '/images/asset-logos/synthetix-snx-logo.svg',
  'ETH.FOX-0XC770EEFAD204B5180DF6A14EE197D99D808EE52D': '/images/asset-logos/fox-token-fox-logo.svg',
  'AVAX.SOL-0XFE6B19286885A4F7F55ADAD09C3CD1F906D2478F': '/images/asset-logos/solana-sol-logo.svg',
  'BASE.ETH': '/images/asset-logos/ethereum-eth-logo.svg',
  'BASE.USDC-0X833589FCD6EDB6E08F4C7C32D4F71B54BDA02913': '/images/asset-logos/usd-coin-usdc-logo.svg',
  'BASE.CBBTC-0XCBB7C0000AB88B473B1F5AFD9EF808440EED33BF': '/images/asset-logos/coinbase-wrapped-btc-logo.svg',
  'ETH.DPI-0X1494CA1F11D487C2BBE4543E90080AEBA4BA3C2B': '/images/asset-logos/dpi-logo.png',
  'ETH.THOR-0XA5F2211B9B8170F694421F2046281775E8468044': '/images/asset-logos/thorswap-logo.png',
  'ETH.VTHOR-0X815C23ECA83261B6EC689B60CC4A58B54BC24D8D': '/images/asset-logos/thorswap-logo.png',
  'ETH.XRUNE-0X69FA0FEE221AD11012BAB0FDB45D444D3D2CE71C': '/images/asset-logos/xrune-logo.png',
  'ETH.TGT-0X108A850856DB3F85D0269A2693D896B394C80325': '/images/asset-logos/tgt-logo.png'
};

interface Pool {
  asset: string;
  status: string;
  balance_rune: string;
  asset_tor_price: string;
}

const swapSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  destinationAddress: z.string().min(1, "Destination address is required"),
  destinationAsset: z.string().min(1, "Destination asset is required"),
});

const settingsSchema = z.object({
  slippageBps: z.coerce
    .number()
    .min(0)
    .max(20)
    .transform(val => Number(val)),
  streamingInterval: z.coerce
    .number()
    .min(1)
    .max(10)
    .transform(val => Number(val)),
});

type SwapFormValues = z.infer<typeof swapSchema>;
type SettingsValues = z.infer<typeof settingsSchema>;

interface SwapFormProps {
  onQuoteReceived?: (quote: QuoteResponse, destinationAsset: string) => void;
  fromAsset: string;
  settings: {
    slippageBps: number;
    streamingInterval: number;
  };
  expanded?: boolean;
  onSettingsChange?: (settings: { slippageBps: number; streamingInterval: number }) => void;
}

export function SwapForm({ onQuoteReceived, fromAsset, settings, expanded = true, onSettingsChange }: SwapFormProps) {
  const { toast } = useToast();
  const { provider } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [destinationAssets, setDestinationAssets] = useState<Record<string, AssetConfig>>({});
  const [showSettings, setShowSettings] = useState(false);

  // Reset form when fromAsset changes
  useEffect(() => {
    form.reset({
      amount: "1",
      destinationAddress: "",
      destinationAsset: 'BTC.BTC',
    });
  }, [fromAsset]);

  // Fetch available pools from THORChain
  useEffect(() => {
    async function fetchPools() {
      try {
        const response = await fetch('https://thornode.ninerealms.com/thorchain/pools');
        const pools: Pool[] = await response.json();
        
        // Sort pools by balance_rune descending
        pools.sort((a, b) => {
          const aBalance = BigInt(a.balance_rune || '0');
          const bBalance = BigInt(b.balance_rune || '0');
          return bBalance > aBalance ? 1 : bBalance < aBalance ? -1 : 0;
        });
        
        // Filter for available pools and create asset configs
        const assets = pools.reduce((acc, pool) => {
          const config = createAssetConfig(pool.asset, pool.status);
          if (config) {
            // Add price information to the config
            config.price = pool.asset_tor_price;
            acc[pool.asset] = config;
          }
          return acc;
        }, {} as Record<string, AssetConfig>);

        // Convert to array, add THOR.RUNE at position 10, then convert back to object
        const assetEntries = Object.entries(assets);
        const runeEntry: [string, AssetConfig] = ['THOR.RUNE', parseAssetId('THOR.RUNE')];
        
        // Insert THOR.RUNE at position 9 (will become 10th entry)
        assetEntries.splice(9, 0, runeEntry);
        
        // Convert back to object
        const orderedAssets = Object.fromEntries(assetEntries);

        setDestinationAssets(orderedAssets);
      } catch (error) {
        console.error('Failed to fetch pools:', error);
        toast({
          title: "Error",
          description: "Failed to fetch available pools",
          variant: "destructive",
        });
      }
    }

    fetchPools();
  }, [toast]);

  const form = useForm<SwapFormValues>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      amount: "1",
      destinationAddress: "",
      destinationAsset: 'BTC.BTC',
    },
  });

  const settingsForm = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      slippageBps: settings.slippageBps,
      streamingInterval: settings.streamingInterval,
    },
  });

  async function onSubmit(values: SwapFormValues) {
    if (!provider) return;
    
    setLoading(true);
    try {
      const quote = await getSwapQuote({
        amount: values.amount,
        fromAsset,
        toAsset: values.destinationAsset,
        destinationAddress: values.destinationAddress,
        slipTolerance: Number(settings.slippageBps) * 100, // Convert % to bps
        streamingInterval: Number(settings.streamingInterval),
      });

      // Call the callback with both the quote data and destination asset
      onQuoteReceived?.(quote, values.destinationAsset);

      // Get the asset name for display
      const assetConfig = destinationAssets[values.destinationAsset];
      const displayName = assetConfig ? assetConfig.name : values.destinationAsset.split('.')[1];

      toast({
        title: "Quote received",
        description: (
          <div className="flex items-center gap-2 text-base">
            <span>Expected output:</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span>{Number(quote.expected_amount_out) / 1e8}</span>
              {assetConfig?.logo && (
                <img 
                  src={assetConfig.logo} 
                  alt={displayName} 
                  className="h-5 w-5" 
                />
              )}
              <span>{displayName}</span>
            </div>
          </div>
        ),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get swap quote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onSettingsSubmit(values: SettingsValues) {
    const newSettings = {
      slippageBps: values.slippageBps,
      streamingInterval: values.streamingInterval
    };
    onSettingsChange?.(newSettings);
    setShowSettings(false);
    toast({
      title: "Settings Updated",
      description: `Slippage: ${newSettings.slippageBps}%, Streaming Interval: ${newSettings.streamingInterval}`,
    });
  }

  // Extract asset symbol from fromAsset string using the utility function
  const { name: assetSymbol } = parseAssetId(fromAsset);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => {
                  const amount = Number(field.value);
                  const selectedAsset = form.watch('destinationAsset');
                  const assetConfig = destinationAssets[selectedAsset];
                  const price = assetConfig?.price ? Number(assetConfig.price) / 1e8 : 0;
                  const usdValue = amount && price ? (amount * price).toFixed(2) : null;

                  return (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-gray-700">Amount ({assetSymbol})</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="0.0" 
                            className="rounded-xl h-12 border-gray-200 focus-visible:ring-[#0052FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {usdValue && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                              ≈ ${usdValue}
                            </div>
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <FormField
                control={form.control}
                name="destinationAsset"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-700">Destination Asset</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-[#0052FF] bg-white/90 backdrop-blur-sm pr-8">
                          <SelectValue placeholder="Select destination asset">
                            {field.value && destinationAssets[field.value] && (
                              <div className="flex items-center gap-2">
                                {destinationAssets[field.value]?.logo && (
                                  <div className="relative w-6 h-6 overflow-visible">
                                    <img 
                                      src={destinationAssets[field.value].logo} 
                                      alt={destinationAssets[field.value].name}
                                      className="h-6 w-6"
                                    />
                                    <img 
                                      src={destinationAssets[field.value].chainLogo} 
                                      alt={destinationAssets[field.value].chain}
                                      className="h-4 w-4 absolute -bottom-1 -right-1 z-10"
                                    />
                                  </div>
                                )}
                                <span className="font-medium">
                                  {destinationAssets[field.value].name}
                                </span>
                                <span className="text-gray-500 text-sm">
                                  ({destinationAssets[field.value].chain})
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
                        {Object.entries(destinationAssets).map(([key, asset]) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="cursor-pointer py-2 px-4 focus:bg-blue-50 hover:bg-gray-50 relative overflow-visible"
                          >
                            <div className="flex items-center justify-between w-full pr-6">
                              <div className="flex items-center gap-2">
                                {asset.logo && (
                                  <div className="relative w-6 h-6 overflow-visible">
                                    <img src={asset.logo} alt={asset.name} className="h-6 w-6" />
                                    <img 
                                      src={asset.chainLogo} 
                                      alt={asset.chain}
                                      className="h-4 w-4 absolute -bottom-1 -right-1 z-10"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{asset.name}</span>
                                  <span className="text-gray-500 text-sm flex items-center gap-1">
                                    ({asset.chain})
                                    <Check className="h-4 w-4 text-green-500 opacity-0 data-[state=checked]:opacity-100" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <FormField
              control={form.control}
              name="destinationAddress"
              render={({ field }) => {
                const selectedAsset = form.watch('destinationAsset');
                const assetConfig = destinationAssets[selectedAsset];
                const chain = assetConfig?.chain || selectedAsset.split('.')[0];
                
                return (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-700">
                      <div className="flex items-center gap-2">
                        {assetConfig?.chainLogo && (
                          <img src={assetConfig.chainLogo} alt={chain} className="h-5 w-5" />
                        )}
                        <span>{chain} Address</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={`Enter ${chain} address`}
                        className="rounded-xl h-12 border-gray-200 focus-visible:ring-[#0052FF]"
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#0052FF] to-[#0066FF] hover:from-[#0066FF] hover:to-[#0052FF] text-white font-semibold py-6 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Getting Quote..." : "Get Quote"}
            </Button>
          </motion.div>
        </form>
      </Form>
    </div>
  );
}
