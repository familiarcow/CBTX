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
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('cbBTC');
  const [swapCountdown, setSwapCountdown] = useState<number | null>(null);
  const [thorchainTxId, setThorchainTxId] = useState<string | null>(null);

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

  const handleAssetSelect = (asset: SupportedAsset) => {
    setSelectedAsset(asset);
    // Clear existing quote when asset changes
    setQuote(null);
  };

  const getAssetAddress = (asset: SupportedAsset) => {
    // Special case for ETH as it doesn't follow the same pattern
    if (asset === 'ETH') {
      return 'BASE.ETH';
    }
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
              runescanUrl: `https://runescan.io/tx/${thorchainTxId}`
            });

            // Start the countdown
            setSwapCountdown(quote.total_swap_seconds);

            toast({
              title: "Transaction Submitted",
              description: (
                <div className="space-y-2">
                  <p>Transaction hash: {hash.slice(0, 6)}...{hash.slice(-4)}</p>
                  <a 
                    href={`https://runescan.io/tx/${thorchainTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    View on Runescan
                  </a>
                  <p>Estimated time: {formatTime(quote.total_swap_seconds)}</p>
                </div>
              ),
            });
          },
          onReceipt: (receipt) => {
            toast({
              title: "Transaction Confirmed",
              description: thorchainTxId ? (
                <div className="space-y-2">
                  <p>Your swap has been initiated on THORChain</p>
                  <a 
                    href={`https://runescan.io/tx/${thorchainTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    Track your swap on Runescan
                  </a>
                  {swapCountdown !== null && swapCountdown > 0 && (
                    <p>Estimated completion in: {formatTime(swapCountdown)}</p>
                  )}
                </div>
              ) : "Your swap has been initiated on THORChain",
            });
          },
          onConfirmation: ({ confirmations }) => {
            if (confirmations === BigInt(1)) {
              toast({
                title: "First Confirmation Received",
                description: thorchainTxId ? (
                  <div className="space-y-2">
                    <p>Your transaction is being processed</p>
                    {swapCountdown !== null && swapCountdown > 0 && (
                      <p>Estimated completion in: {formatTime(swapCountdown)}</p>
                    )}
                  </div>
                ) : "Your transaction is being processed",
              });
            }
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
        runescanUrl: thorchainTxId ? `https://runescan.io/tx/${thorchainTxId}` : null,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-white/50">
            <CardTitle className="text-2xl font-bold text-[#0052FF] flex items-center gap-2">
              <motion.span
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                Swap {selectedAsset} to BTC
              </motion.span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>

        {account ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-white/50">
                  <CardTitle>Your Balances</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <TokenBalance 
                    symbol="ETH" 
                    isSelected={selectedAsset === 'ETH'}
                    onSelect={() => handleAssetSelect('ETH')}
                  />
                  <TokenBalance 
                    symbol="USDC" 
                    isSelected={selectedAsset === 'USDC'}
                    onSelect={() => handleAssetSelect('USDC')}
                  />
                  <TokenBalance 
                    symbol="cbBTC" 
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
                  <CardTitle>Swap</CardTitle>
                </CardHeader>
                <CardContent>
                  <SwapForm 
                    onQuoteReceived={setQuote}
                    fromAsset={getAssetAddress(selectedAsset)}
                  />
                </CardContent>
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
                    <CardTitle>Swap Quote Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-gray-600 font-medium">Expected Output</div>
                      <div className="font-semibold text-[#0052FF]">{formatBTCAmount(quote.expected_amount_out)} BTC</div>
                      
                      <div className="text-gray-600 font-medium">Minimum Output</div>
                      <div className="font-semibold text-orange-500">{formatBTCAmount(calculateMinOutput(quote.expected_amount_out, 300))} BTC</div>
                      
                      <div className="text-gray-600 font-medium">Estimated Time</div>
                      <div className="font-semibold">~{Math.ceil(quote.total_swap_seconds / 60)} minutes</div>
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
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center text-gray-500">
                Please connect your wallet to view balances
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
