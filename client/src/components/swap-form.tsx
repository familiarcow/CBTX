import React from 'react';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSwapQuote, type QuoteResponse } from "@/lib/thorchain";
import { useWeb3 } from "@/lib/web3";
import { ArrowDown, Package, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const swapSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  destinationAddress: z.string().min(1, "BTC address is required"),
});

const settingsSchema = z.object({
  slippageBps: z.string()
    .transform(Number)
    .refine(val => val >= 0 && val <= 20, {
      message: "Slippage must be between 0% and 20%"
    }),
  streamingInterval: z.string()
    .transform(Number)
    .refine(val => val >= 1 && val <= 10, {
      message: "Streaming interval must be between 1 and 10 blocks"
    }),
});

type SwapFormValues = z.infer<typeof swapSchema>;
type SettingsValues = z.infer<typeof settingsSchema>;

interface SwapFormProps {
  onQuoteReceived?: (quote: QuoteResponse) => void;
  fromAsset: string;
}

export function SwapForm({ onQuoteReceived, fromAsset }: SwapFormProps) {
  const { toast } = useToast();
  const { provider } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    slippageBps: 3,
    streamingInterval: 1,
  });

  const form = useForm<SwapFormValues>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      amount: "1",
      destinationAddress: "bc1qf803r8t3sc8s4h0kp8n5njdr5e8fexqcsa6egj",
    },
  });

  const settingsForm = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      slippageBps: settings.slippageBps.toString(),
      streamingInterval: settings.streamingInterval.toString(),
    },
  });

  const onSettingsSubmit = (values: SettingsValues) => {
    setSettings({
      slippageBps: Number(values.slippageBps),
      streamingInterval: Number(values.streamingInterval),
    });
    setShowSettings(false);
    toast({
      title: "Settings Updated",
      description: `Slippage: ${values.slippageBps}%, Streaming Interval: ${values.streamingInterval}`,
      className: "bg-white border border-gray-200 text-gray-900 shadow-lg",
    });
  };

  async function onSubmit(values: SwapFormValues) {
    if (!provider) return;
    
    setLoading(true);
    try {
      const quote = await getSwapQuote({
        amount: values.amount,
        fromAsset,
        toAsset: "BTC.BTC",
        destinationAddress: values.destinationAddress,
        slipTolerance: Number(settings.slippageBps) * 100, // Convert % to bps
        streamingInterval: Number(settings.streamingInterval),
      });

      // Call the callback with the quote data
      onQuoteReceived?.(quote);

      toast({
        title: "Quote received",
        description: `Expected output: ${Number(quote.expected_amount_out) / 1e8} BTC`,
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

  // Extract asset symbol from fromAsset string (e.g., "BASE.CBBTC-0X..." -> "cbBTC")
  const assetSymbol = fromAsset.split('.')[1].split('-')[0];

  return (
    <div className="space-y-6">
      <Popover open={showSettings} onOpenChange={setShowSettings}>
        <div className="flex justify-end items-center gap-2 text-sm">
          <PopoverTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <Settings2 className="h-4 w-4 text-gray-500" />
              {settings.slippageBps}%
            </motion.button>
          </PopoverTrigger>
          <PopoverTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <Package className="h-4 w-4 text-gray-500" />
              {settings.streamingInterval}
            </motion.button>
          </PopoverTrigger>
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
        </div>
      </Popover>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-gray-700">Amount ({assetSymbol})</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      placeholder="0.0" 
                      className="rounded-xl h-12 border-gray-200 focus-visible:ring-[#0052FF]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <FormField
              control={form.control}
              name="destinationAddress"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-gray-700">BTC Address</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter BTC address" 
                      className="rounded-xl h-12 border-gray-200 focus-visible:ring-[#0052FF]"
                    />
                  </FormControl>
                </FormItem>
              )}
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
