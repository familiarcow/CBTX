import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
import { SwapForm } from "@/components/swap-form";
import { TokenBalance } from "@/components/token-balance";
import { useWeb3 } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { QuoteResponse } from "@/lib/thorchain";
import { getInboundAddresses, calculateMinOutput, CBBTC_ADDRESS } from "@/lib/thorchain";
import { motion } from "framer-motion";
import { approveERC20, depositWithExpiry, getRouterAddress } from "@/lib/callcontract";
import { LogoHeader } from "@/components/logo-header";
import { Footer } from "@/components/footer";
import { Settings2, Package, ChevronDown, ChevronUp, ArrowUpRight } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { truncateAddress } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAssetLogo, parseAssetId, getChainLogo } from "@/lib/asset-utils";

// Import asset logos
import btcLogo from '../../images/btc-logo.svg';
import cbbtcLogo from '../../images/cbbtc-logo.svg';
import ethLogo from '../../images/eth-logo.svg';
import usdcLogo from '../../images/usd-coin-usdc-logo.svg';
import baseLogo from '../../images/base-logo.svg';

// Define supported assets
const SUPPORTED_ASSETS = {
  ETH: {
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    decimals: 18
  },
  USDC: {
    symbol: 'USDC',
    address: '0X833589FCD6EDB6E08F4C7C32D4F71B54BDA02913',
    decimals: 6
  },
  cbBTC: {
    symbol: 'cbBTC',
    address: '0XCBB7C0000AB88B473B1F5AFD9EF808440EED33BF',
    decimals: 8
  }
} as const;

type SupportedAsset = keyof typeof SUPPORTED_ASSETS;

export default function Home() {
  const { account, web3 } = useWeb3();
  const { toast } = useToast();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [destinationAsset, setDestinationAsset] = useState<string>('BTC.BTC');
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('ETH');
  const [swapCountdown, setSwapCountdown] = useState<number | null>(null);
  const [thorchainTxId, setThorchainTxId] = useState<string | null>(null);
  const [isSwapCollapsed, setIsSwapCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    slippageBps: 3,
    streamingInterval: 1
  });

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

  // Add countdown effect
  useEffect(() => {
    if (swapCountdown === null) return;
    
    const timer = setInterval(() => {
      setSwapCountdown(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [swapCountdown]);

  // Format countdown time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add effect to track account changes
  useEffect(() => {
    console.log('Account changed:', {
      hasAccount: !!account,
      accountAddress: account,
      timestamp: new Date().toISOString(),
    });
  }, [account]);

  // Format BTC amount
  const formatBTCAmount = (amount: string) => {
    const btcAmount = Number(amount) / 1e8; // Convert from sats to BTC
    return btcAmount.toFixed(8);
  };

  // Add effect for auto-scrolling and collapsing when quote is received
  useEffect(() => {
    if (quote) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
      // Auto collapse when quote is received
      setIsSwapCollapsed(true);
    }
  }, [quote]);

  // Force expand swap form when selected asset changes
  useEffect(() => {
    setIsSwapCollapsed(false);
    setQuote(null); // Clear existing quote
  }, [selectedAsset]);

  const handleAssetSelect = (asset: SupportedAsset) => {
    setSelectedAsset(asset);
    // Clear existing quote when asset changes
    setQuote(null);
  };

  const getAssetAddress = (asset: SupportedAsset) => {
    // Special case for ETH as it doesn't follow the same pattern
    if (asset === 'ETH') 
      return 'BASE.ETH';
    return `BASE.${asset}-${SUPPORTED_ASSETS[asset].address.toUpperCase()}`;
  };

  const handleTransaction = async () => {
    if (!quote || !web3 || !account) return;

    try {
      setIsSending(true);
      setThorchainTxId(null); // Reset transaction ID
      setSwapCountdown(null); // Reset countdown

      console.log('Starting transaction with quote:', {
        quote,
        selectedAsset,
        memo: quote.memo
      });

      // 1. Get inbound addresses
      const inboundAddresses = await getInboundAddresses();
      const baseChainAddress = inboundAddresses.find(addr => addr.chain === 'BASE');
      
      if (!baseChainAddress) {
        throw new Error('BASE chain inbound address not found');
      }

      // Get router address
      const routerAddress = await getRouterAddress('BASE');

      // Get token address from supported assets
      const tokenAddress = SUPPORTED_ASSETS[selectedAsset].address.toLowerCase();

      // Extract and validate amount from quote (always in 1e8)
      const quoteAmount = quote.input_amount;
      if (!quoteAmount) {
        throw new Error('Invalid amount in quote');
      }

      // Convert amount from 1e8 to the token's decimals
      const convertAmount = (amount: string, fromDecimals: number, toDecimals: number): string => {
        const value = BigInt(amount);
        if (fromDecimals === toDecimals) return amount;
        
        if (fromDecimals > toDecimals) {
          return (value / BigInt(10 ** (fromDecimals - toDecimals))).toString();
        } else {
          return (value * BigInt(10 ** (toDecimals - fromDecimals))).toString();
        }
      };

      // Convert from quote's 1e8 to token's decimals
      const amount = convertAmount(quoteAmount, 8, SUPPORTED_ASSETS[selectedAsset].decimals);

      console.log('Amount conversion:', {
        asset: selectedAsset,
        quoteAmount,
        quoteParsed: Number(quoteAmount) / 1e8,
        tokenDecimals: SUPPORTED_ASSETS[selectedAsset].decimals,
        convertedAmount: amount,
        convertedParsed: Number(amount) / (10 ** SUPPORTED_ASSETS[selectedAsset].decimals)
      });

      // Validate amount is a valid number
      try {
        const amountBN = BigInt(amount);
        if (amountBN <= 0) {
          throw new Error('Amount must be greater than 0');
        }
      } catch (error) {
        console.error('Amount validation failed:', error);
        throw new Error('Invalid amount format');
      }

      // 2. If not native ETH, handle approval
      const isNativeToken = tokenAddress === '0x0000000000000000000000000000000000000000';
      
      if (!isNativeToken) {
        setIsApproving(true);
        toast({
          title: "Approval Required",
          description: "Please approve the token transfer in your wallet",
        });

        try {
          await approveERC20(
            web3,
            tokenAddress,
            routerAddress,
            amount, // Using converted amount for approval
            account
          );
        } catch (error) {
          // If error is "Sufficient allowance already exists", we can proceed
          if (!(error instanceof Error && error.message === 'Sufficient allowance already exists')) {
            throw error;
          }
        }
        setIsApproving(false);
      }

      // 3. Send the transaction
      toast({
        title: "Sending Transaction",
        description: "Please confirm the transaction in your wallet",
      });

      // Log transaction parameters
      console.log('Constructing transaction with parameters:', {
        routerAddress,
        vault: baseChainAddress.address,
        asset: tokenAddress,
        quoteAmount,
        convertedAmount: amount,
        isNativeToken,
        contractAmount: isNativeToken ? '0' : amount,
        valueAmount: isNativeToken ? amount : '0',
        memo: quote.memo,
        fromAddress: account,
        assetDecimals: SUPPORTED_ASSETS[selectedAsset].decimals,
      });

      const receipt = await depositWithExpiry(
        web3,
        routerAddress,
        {
          vault: baseChainAddress.address,
          asset: tokenAddress,
          amount: isNativeToken ? '0' : amount,
          memo: quote.memo,
          fromAddress: account,
          value: isNativeToken ? amount : '0',
        },
        {
          onSending: (payload) => {
            console.log('Transaction payload:', payload);
            toast({
              title: "Transaction Initiated",
              description: "Please confirm in your wallet",
            });
          },
          onTransactionHash: (hash) => {
            // Convert to THORChain transaction ID format
            const thorchainTxId = hash.slice(2).toUpperCase(); // Remove '0x' and convert to uppercase
            setThorchainTxId(thorchainTxId);
            
            console.log('Transaction IDs:', {
              ethTxHash: hash,
              thorchainTxId,
              trackerUrl: `https://track.ninerealms.com/${thorchainTxId}`
            });

            // Start the countdown
            setSwapCountdown(quote.total_swap_seconds);

            toast({
              title: "Transaction Submitted",
              description: (
                <div className="space-y-2">
                  <p>Transaction hash: {hash.slice(0, 6)}...{hash.slice(-4)}</p>
                  <p>Estimated time: {formatTime(quote.total_swap_seconds)}</p>
                </div>
              ),
            });
          },
          onError: (error) => {
            console.error('Transaction error:', error);
            setSwapCountdown(null); // Reset countdown on error
            setThorchainTxId(null); // Reset transaction ID on error
            toast({
              title: "Transaction Failed",
              description: error.message || "Failed to send transaction",
              variant: "destructive",
            });
            throw error;
          },
        }
      );

      console.log('Transaction successful:', {
        receipt,
        thorchainTxId,
        trackerUrl: thorchainTxId ? `https://track.ninerealms.com/${thorchainTxId}` : null,
        estimatedTimeRemaining: swapCountdown !== null ? formatTime(swapCountdown) : null
      });

    } catch (error) {
      console.error('Transaction error:', error);
      setSwapCountdown(null); // Reset countdown on error
      setThorchainTxId(null); // Reset transaction ID on error
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <div className="relative">
        <LogoHeader />
        <div className="p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
              {!account && (
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <div className="mb-8 flex flex-col items-center">
                    <h1 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900 flex items-center justify-center flex-nowrap whitespace-nowrap">
                      <span className="inline-flex items-center">
                        From{" "}
                        <img src={baseLogo} alt="Base" className="h-6 w-6 md:h-8 md:w-8 mx-1 md:mx-2" />
                        Base
                      </span>
                      {" "}→{" "}
                      <span className="inline-flex items-center">
                        <img src={btcLogo} alt="Bitcoin" className="h-6 w-6 md:h-8 md:w-8 mx-1 md:mx-2" />
                        Bitcoin
                      </span>
                    </h1>
                  </div>
                  <WalletConnect />
                  <div className="mt-4 text-gray-500 text-sm">
                    <a
                      href={`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      Open in Coinbase Wallet
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              )}
            </Card>

            {account ? (
              <>
                {account && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <a
                      href={`https://basescan.org/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-white/95 transition-colors"
                    >
                      <img src={baseLogo} alt="Base" className="h-4 w-4" />
                      {truncateAddress(account)}
                      <span className="sr-only">View on Basescan</span>
                    </a>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-white/50">
                      <CardTitle>Balances</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                      <TokenBalance 
                        symbol="ETH" 
                        logo={ethLogo}
                        chainLogo={baseLogo}
                        isSelected={selectedAsset === 'ETH'}
                        onSelect={() => handleAssetSelect('ETH')}
                      />
                      <TokenBalance 
                        symbol="USDC" 
                        logo={usdcLogo}
                        chainLogo={baseLogo}
                        isSelected={selectedAsset === 'USDC'}
                        onSelect={() => handleAssetSelect('USDC')}
                      />
                      <TokenBalance 
                        symbol="cbBTC" 
                        logo={cbbtcLogo}
                        chainLogo={baseLogo}
                        isSelected={selectedAsset === 'cbBTC'}
                        onSelect={() => handleAssetSelect('cbBTC')}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

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
                                  src={selectedAsset === 'ETH' ? ethLogo : selectedAsset === 'USDC' ? usdcLogo : cbbtcLogo} 
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
                            onClick={() => setIsSwapCollapsed(!isSwapCollapsed)}
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
                            onQuoteReceived={(quote, destAsset) => {
                              setQuote(quote);
                              setDestinationAsset(destAsset);
                            }}
                            fromAsset={getAssetAddress(selectedAsset)}
                            settings={settings}
                            expanded={!isSwapCollapsed}
                            onSettingsChange={setSettings}
                          />
                        </CardContent>
                      )}
                    </motion.div>
                  </Card>
                </motion.div>

                {quote && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
                      <CardHeader className="bg-white/50">
                        <CardTitle>Quote</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="text-gray-600 font-medium mb-2">Expected Output</div>
                          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-[#0052FF]">
                            {formatBTCAmount(quote.expected_amount_out)}
                            <div className="relative">
                              <img 
                                src={getAssetLogo(destinationAsset, btcLogo)} 
                                alt={parseAssetId(destinationAsset).name} 
                                className="h-6 w-6"
                              />
                              <img 
                                src={getChainLogo(parseAssetId(destinationAsset).chain)}
                                alt={parseAssetId(destinationAsset).chain}
                                className="h-4 w-4 absolute -bottom-1 -right-1"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-gray-600 font-medium">Minimum Output</div>
                          <div className="font-semibold text-orange-500 flex items-center gap-2">
                            {formatBTCAmount(calculateMinOutput(quote.expected_amount_out, 300))}
                            <div className="relative">
                              <img 
                                src={getAssetLogo(destinationAsset, btcLogo)} 
                                alt={parseAssetId(destinationAsset).name} 
                                className="h-4 w-4"
                              />
                              <img 
                                src={getChainLogo(parseAssetId(destinationAsset).chain)}
                                alt={parseAssetId(destinationAsset).chain}
                                className="h-3 w-3 absolute -bottom-1 -right-1"
                              />
                            </div>
                          </div>
                          
                          <div className="text-gray-600 font-medium">Estimated Time</div>
                          <div className="font-semibold flex items-center gap-2">
                            ~{Math.ceil(quote.total_swap_seconds / 60)} minutes
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <img 
                                  src={getAssetLogo(getAssetAddress(selectedAsset), selectedAsset === 'ETH' ? ethLogo : selectedAsset === 'USDC' ? usdcLogo : cbbtcLogo)} 
                                  alt={selectedAsset} 
                                  className="h-4 w-4" 
                                />
                                <img 
                                  src={getChainLogo(parseAssetId(getAssetAddress(selectedAsset)).chain)}
                                  alt={parseAssetId(getAssetAddress(selectedAsset)).chain}
                                  className="h-3 w-3 absolute -bottom-1 -right-1"
                                />
                              </div>
                              <span className="mx-1">→</span>
                              <div className="relative">
                                <img 
                                  src={getAssetLogo(destinationAsset, btcLogo)} 
                                  alt={parseAssetId(destinationAsset).name} 
                                  className="h-4 w-4"
                                />
                                <img 
                                  src={getChainLogo(parseAssetId(destinationAsset).chain)}
                                  alt={parseAssetId(destinationAsset).chain}
                                  className="h-3 w-3 absolute -bottom-1 -right-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            onClick={handleTransaction}
                            disabled={isApproving || isSending}
                            className="w-full bg-gradient-to-r from-[#F2A900] to-[#F4B721] hover:from-[#F4B721] hover:to-[#F2A900] text-white font-semibold py-6 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isApproving 
                              ? "Approving..." 
                              : isSending 
                                ? "Sending Transaction..." 
                                : "Send Transaction"}
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {thorchainTxId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6"
                  >
                    <Card className="border border-gray-100 shadow-lg rounded-2xl overflow-hidden bg-white">
                      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                        <CardTitle className="text-lg font-semibold text-gray-800">Transaction Status</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                            <div className="space-y-4">
                              <div className="flex flex-col gap-2">
                                <span className="text-sm text-gray-500 font-medium">Transaction ID</span>
                                <code className="font-mono text-sm bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800">
                                  {thorchainTxId}
                                </code>
                              </div>
                              
                              {swapCountdown !== null && swapCountdown > 0 && (
                                <div className="flex flex-col gap-2">
                                  <span className="text-sm text-gray-500 font-medium">Estimated Completion</span>
                                  <div className="flex items-center gap-2 text-gray-800 font-medium">
                                    <span>{formatTime(swapCountdown)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <a 
                              href={`https://track.ninerealms.com/${thorchainTxId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#F2A900] to-[#F4B721] hover:from-[#F4B721] hover:to-[#F2A900] text-white font-semibold rounded-xl shadow-md transition-all duration-300"
                            >
                              Track Swap
                              <ArrowUpRight className="h-5 w-5" />
                            </a>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            ) : null}
          </motion.div>
        </div>
      </div>
    <Footer />
    </div>
  );
}
