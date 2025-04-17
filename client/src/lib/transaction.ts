import { approveERC20, depositWithExpiry, getRouterAddress } from "@/lib/callcontract";
import { getInboundAddresses } from "@/lib/thorchain";
import { SUPPORTED_ASSETS, SupportedAsset } from "@/lib/constants";
import type { QuoteResponse } from "@/lib/thorchain";
import type { ToastProps } from "@/components/ui/toast";

// Event for triggering balance refresh
export const refreshBalancesEvent = new CustomEvent('refresh-balances');

type TransactionParams = {
  web3: any;
  account: string;
  quote: QuoteResponse;
  selectedAsset: SupportedAsset;
  toast: (props: ToastProps & { title: string; description: string; variant?: "default" | "destructive" }) => void;
  onTxHash: (hash: string) => void;
  onCountdown: (seconds: number) => void;
  onError: (error: Error) => void;
};

// Helper function to trigger balance refresh with delay
const triggerBalanceRefresh = (delayMs = 500) => {
  setTimeout(() => {
    window.dispatchEvent(refreshBalancesEvent);
  }, delayMs);
};

export const handleTransaction = async ({
  web3,
  account,
  quote,
  selectedAsset,
  toast,
  onTxHash,
  onCountdown,
  onError
}: TransactionParams): Promise<void> => {
  if (!quote || !web3 || !account) return;

  try {
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
        
        // Refresh balances after approval with delay
        triggerBalanceRefresh();
      } catch (error) {
        // If error is "Sufficient allowance already exists", we can proceed
        if (!(error instanceof Error && error.message === 'Sufficient allowance already exists')) {
          throw error;
        }
      }
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
          onTxHash(thorchainTxId);
          
          console.log('Transaction IDs:', {
            ethTxHash: hash,
            thorchainTxId,
            trackerUrl: `https://track.ninerealms.com/${thorchainTxId}`
          });

          // Start the countdown
          onCountdown(quote.total_swap_seconds);

          // Refresh balances after transaction hash is received
          triggerBalanceRefresh();

          toast({
            title: "Transaction Submitted",
            description: `Transaction hash: ${hash.slice(0, 6)}...${hash.slice(-4)}, Estimated time: ${Math.ceil(quote.total_swap_seconds / 60)} minutes`,
          });
        },
        onError: (error) => {
          console.error('Transaction error:', error);
          onError(error);
          toast({
            title: "Transaction Failed",
            description: error.message || "Failed to send transaction",
            variant: "destructive",
          });
          throw error;
        },
      }
    );

    // Safely handle the transaction hash which could be different types
    const txHash = typeof receipt.transactionHash === 'string' 
      ? receipt.transactionHash 
      : '';

    console.log('Transaction successful:', {
      receipt,
      trackerUrl: txHash ? `https://track.ninerealms.com/${txHash.slice(2).toUpperCase()}` : 'Not available',
    });

  } catch (error) {
    console.error('Transaction error:', error);
    onError(error instanceof Error ? error : new Error('Unknown error'));
    
    toast({
      title: "Transaction Failed",
      description: error instanceof Error ? error.message : "Failed to send transaction",
      variant: "destructive",
    });
  }
}; 