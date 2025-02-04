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
  settings: {
    slippageBps: number;
    streamingInterval: number;
  };
}

export function SwapForm({ onQuoteReceived, fromAsset, settings }: SwapFormProps) {
  const { toast } = useToast();
  const { provider } = useWeb3();
  const [loading, setLoading] = useState(false);

  const form = useForm<SwapFormValues>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      amount: "1",
      destinationAddress: "bc1qf803r8t3sc8s4h0kp8n5njdr5e8fexqcsa6egj",
    },
  });

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
