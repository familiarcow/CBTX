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
  parseAssetId,
  ASSET_LOGOS,
  CHAIN_LOGOS 
} from "@/lib/asset-utils";

// List of EVM chains that can use Base address
const EVM_CHAINS = ['ETH', 'BASE', 'AVAX', 'BSC'];

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
  const { provider, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [destinationAssets, setDestinationAssets] = useState<Record<string, AssetConfig>>({});
  const [assetPrices, setAssetPrices] = useState<Record<string, string>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const form = useForm<SwapFormValues>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      amount: "1",
      destinationAddress: "",
      destinationAsset: 'BTC.BTC',
    },
  });

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
      setPricesLoading(true);
      try {
        const response = await fetch('https://thornode.ninerealms.com/thorchain/pools');
        const pools: Pool[] = await response.json();
        
        // Sort pools by balance_rune descending
        pools.sort((a, b) => {
          const aBalance = BigInt(a.balance_rune || '0');
          const bBalance = BigInt(b.balance_rune || '0');
          return bBalance > aBalance ? 1 : bBalance < aBalance ? -1 : 0;
        });
        
        // Store prices separately
        const prices = pools.reduce((acc, pool) => {
          acc[pool.asset] = pool.asset_tor_price;
          return acc;
        }, {} as Record<string, string>);
        setAssetPrices(prices);
        
        // Filter for available pools and create asset configs
        const assets = pools.reduce((acc, pool) => {
          const config = createAssetConfig(pool.asset, pool.status);
          if (config) {
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
      } finally {
        setPricesLoading(false);
      }
    }

    fetchPools();
  }, [toast]);

  // Set up a watcher for the destination asset to auto-fill EVM addresses
  const selectedAsset = form.watch('destinationAsset');
  
  // When the selected asset or available assets change, check if we should auto-fill the Base address
  useEffect(() => {
    if (!selectedAsset || !account || Object.keys(destinationAssets).length === 0) return;
    
    const assetConfig = destinationAssets[selectedAsset];
    if (assetConfig && EVM_CHAINS.includes(assetConfig.chain)) {
      // Auto-fill the Base address for EVM chains
      form.setValue('destinationAddress', account);
    }
  }, [selectedAsset, destinationAssets, account, form]);

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
                  const upperAsset = fromAsset.toUpperCase();
                  const price = !pricesLoading && assetPrices[upperAsset] ? Number(assetPrices[upperAsset]) / 1e8 : 0;
                  console.log('Asset Price Details:', {
                    asset: fromAsset,
                    upperAsset,
                    pricesLoading,
                    rawPrice: assetPrices[upperAsset],
                    calculatedPrice: price,
                    amount: amount,
                    usdValue: amount * price
                  });
                  const usdValue = !pricesLoading && amount && price ? (amount * price).toFixed(2) : null;

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
                          {pricesLoading ? (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              Loading price...
                            </div>
                          ) : usdValue && (
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
                const isEvmChain = EVM_CHAINS.includes(chain);
                
                return (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-700">
                      <div className="flex items-center gap-2">
                        {assetConfig?.chainLogo && (
                          <img src={assetConfig.chainLogo} alt={chain} className="h-5 w-5" />
                        )}
                        <span>{chain} Address</span>
                        {isEvmChain && account && (
                          <span className="text-xs text-green-600 font-normal ml-1">
                            (Using Base address)
                          </span>
                        )}
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
