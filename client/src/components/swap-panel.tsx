import { useState } from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwapForm } from "@/components/swap-form";
import { Settings2, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { QuoteResponse } from "@/lib/thorchain";

interface SwapPanelProps {
  onQuoteReceived: (quote: QuoteResponse, destAsset: string) => void;
  fromAsset: string;
  settings: {
    slippageBps: number;
    streamingInterval: number;
  };
  isSwapCollapsed: boolean;
  onSwapCollapse: (collapsed: boolean) => void;
  quote: QuoteResponse | null;
  selectedAsset: 'ETH' | 'USDC' | 'cbBTC';
}

export function SwapPanel({ 
  onQuoteReceived, 
  fromAsset, 
  settings,
  isSwapCollapsed,
  onSwapCollapse,
  quote,
  selectedAsset
}: SwapPanelProps) {
  const [showSettings, setShowSettings] = useState(false);

  // Define settings schema for validation
  const settingsSchema = z.object({
    slippageBps: z.coerce.number().min(0).max(20).transform(String),
    streamingInterval: z.coerce.number().min(1).max(10).transform(String),
  });

  type SettingsValues = z.infer<typeof settingsSchema>;

  const settingsForm = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      slippageBps: settings.slippageBps.toString(),
      streamingInterval: settings.streamingInterval.toString(),
    },
  });

  const onSettingsSubmit = (values: SettingsValues) => {
    const newSettings = {
      slippageBps: Number(values.slippageBps),
      streamingInterval: Number(values.streamingInterval),
    };
    
    setShowSettings(false);
  };

  // Get asset logo based on selected asset
  const getAssetLogo = (asset: 'ETH' | 'USDC' | 'cbBTC') => {
    switch (asset) {
      case 'ETH':
        return '/images/eth-logo.svg';
      case 'USDC':
        return '/images/usd-coin-usdc-logo.svg';
      case 'cbBTC':
        return '/images/cbbtc-logo.svg';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-white/50">
          <div className="flex items-center justify-between">
            <CardTitle>Swap</CardTitle>
            <div className="flex-1 flex items-center justify-center mx-4">
              {isSwapCollapsed && quote && (
                <div className="text-sm text-gray-500 text-center px-3 py-1.5 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-1">
                    {(Number(quote.input_amount) / 1e8).toFixed(8)}{" "}
                    <img 
                      src={getAssetLogo(selectedAsset)} 
                      alt={selectedAsset} 
                      className="h-4 w-4 inline" 
                    />
                    <span className="text-gray-400 mx-1">to</span>
                    <span className="font-mono" title={quote.destination_address}>
                      {quote.destination_address.slice(0, 6)}...{quote.destination_address.slice(-6)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <div className="flex items-center gap-2 text-sm">
                  <PopoverTrigger asChild>
                    <button 
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Settings2 className="h-4 w-4 text-gray-500" />
                      <span>{settings.slippageBps}%</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverTrigger asChild>
                    <button 
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>{settings.streamingInterval}</span>
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent className="w-80 bg-white border-0 shadow-lg p-6 rounded-2xl">
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                      <div className="font-medium text-lg pb-2 border-b">Swap Settings</div>
                      <FormField
                        control={settingsForm.control}
                        name="slippageBps"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-gray-700">Slippage Tolerance (%)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                max="20"
                                className="rounded-xl h-12 border-gray-200 focus-visible:ring-[#0052FF]" 
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs">
                              Any sub-swap executing at less than the quote less this % will be refunded
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={settingsForm.control}
                        name="streamingInterval"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-gray-700">Streaming Interval</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1" 
                                max="10"
                                className="rounded-xl h-12 border-gray-200 focus-visible:ring-[#0052FF]" 
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs">
                              Number of blocks to wait between each streaming swap
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          type="submit" 
                          className="w-full bg-[#0052FF] hover:bg-[#0052FF]/90 text-white rounded-xl h-12 font-medium shadow-md transition-all duration-200"
                        >
                          Save Settings
                        </Button>
                      </motion.div>
                    </form>
                  </Form>
                </PopoverContent>
              </Popover>
              <button
                onClick={() => onSwapCollapse(!isSwapCollapsed)}
                className="text-gray-500 hover:text-gray-700 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                {isSwapCollapsed ? '+' : '−'}
              </button>
            </div>
          </div>
        </CardHeader>
        <motion.div
          initial={false}
          animate={{ 
            height: isSwapCollapsed ? 0 : "auto",
            opacity: isSwapCollapsed ? 0 : 1
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="overflow-hidden"
        >
          {!isSwapCollapsed && (
            <CardContent>
              <SwapForm 
                onQuoteReceived={onQuoteReceived}
                fromAsset={fromAsset}
                settings={settings}
                expanded={!isSwapCollapsed}
              />
            </CardContent>
          )}
        </motion.div>
      </Card>
    </motion.div>
  );
} 