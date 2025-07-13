import React from 'react';
import { useState, createContext, useContext } from "react";
import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";
import type { CoinbaseWalletProvider } from "@coinbase/wallet-sdk";
import Web3 from 'web3';

const APP_NAME = 'FromBase.xyz';
const APP_LOGO_URL = 'https://frombase.xyz/images/frombase-logo.png';
const DEFAULT_CHAIN_ID = 8453;
const RPC_URL = 'https://mainnet.base.org';
const APP_SUPPORTED_CHAIN_IDS = [DEFAULT_CHAIN_ID];

// Base chain configuration
const BASE_CHAIN_CONFIG = {
  chainId: `0x${DEFAULT_CHAIN_ID.toString(16)}`, // '0x2105'
  chainName: 'Base',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ['https://basescan.org']
};

// Initialize outside component to prevent re-initialization
const coinbaseWallet = new CoinbaseWalletSDK({
  appName: APP_NAME,
  appLogoUrl: APP_LOGO_URL
});

// Initialize provider outside component with Base chain configuration
const ethereum = coinbaseWallet.makeWeb3Provider();

// Initialize Web3 with the provider
const web3 = new Web3(ethereum as any);

// Add logging for debugging RPC issues
console.log('=== WEB3 PROVIDER INITIALIZATION ===');
console.log('Environment details:', {
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  origin: typeof window !== 'undefined' ? window.location.origin : 'server',
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
  timestamp: new Date().toISOString()
});

console.log('Web3 provider configuration:', {
  appName: APP_NAME,
  appLogoUrl: APP_LOGO_URL,
  defaultChainId: DEFAULT_CHAIN_ID,
  rpcUrl: RPC_URL,
  supportedChainIds: APP_SUPPORTED_CHAIN_IDS,
  providerType: ethereum?.constructor?.name || 'Unknown',
  // @ts-ignore
  isCoinbaseWallet: ethereum?.isCoinbaseWallet,
  // @ts-ignore
  isMetaMask: ethereum?.isMetaMask
});

// Test basic connectivity
if (typeof window !== 'undefined') {
  ethereum?.request?.({ method: 'eth_chainId' })
    .then((chainId: unknown) => {
      const chainIdStr = chainId as string;
      console.log('Initial chain ID check:', {
        chainId: chainIdStr,
        chainIdDecimal: parseInt(chainIdStr, 16),
        expectedChainId: DEFAULT_CHAIN_ID,
        isCorrectChain: parseInt(chainIdStr, 16) === DEFAULT_CHAIN_ID
      });
    })
    .catch((error: any) => {
      console.error('Initial chain ID check failed:', {
        error,
        message: error.message,
        code: error.code
      });
    });
}

interface Web3ContextType {
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  provider: any;
  web3: Web3;
  chainId: number | null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  connect: async () => {},
  disconnect: async () => {},
  provider: null,
  web3,
  chainId: null
});

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [web3Provider, setWeb3Provider] = useState<any>(ethereum);
  const [chainId, setChainId] = useState<number | null>(null);

  // Handle chain changes
  React.useEffect(() => {
    if (web3Provider) {
      web3Provider.on('chainChanged', (newChainId: string) => {
        setChainId(parseInt(newChainId));
        // Reinitialize web3 with the new chain
        web3.setProvider(web3Provider);
      });

      // Handle account changes
      web3Provider.on('accountsChanged', (accounts: string[]) => {
        if (accounts[0]) {
          setAccount(accounts[0]);
          web3.eth.defaultAccount = accounts[0];
        } else {
          setAccount(null);
          web3.eth.defaultAccount = undefined;
        }
      });
    }
    return () => {
      if (web3Provider) {
        web3Provider.removeListener('chainChanged', () => {});
        web3Provider.removeListener('accountsChanged', () => {});
      }
    };
  }, [web3Provider]);

  const switchToBaseChain = async () => {
    if (!web3Provider) return;
    
    try {
      // Try to switch to Base chain
      await web3Provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // If Base chain is not added to wallet, add it
      if (switchError.code === 4902) {
        try {
          await web3Provider.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_CHAIN_CONFIG],
          });
        } catch (addError) {
          console.error('Error adding Base chain:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching to Base chain:', switchError);
        throw switchError;
      }
    }
  };

  const connect = async () => {
    try {
      if (!web3Provider) return;
      
      // Request account access
      const accounts = await web3Provider.request({ method: "eth_requestAccounts" });
      
      // Switch to Base chain
      await switchToBaseChain();
      
      // Get current chain ID
      const currentChainId = await web3Provider.request({ method: 'eth_chainId' });
      setChainId(parseInt(currentChainId as string));
      
      if (Array.isArray(accounts) && accounts[0]) {
        setAccount(accounts[0]);
        web3.eth.defaultAccount = accounts[0];
      }
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      // Clear local state first
      setAccount(null);
      setChainId(null);
      web3.eth.defaultAccount = undefined;
      
      // Properly disconnect from the provider
      if (web3Provider && typeof web3Provider.close === 'function') {
        await web3Provider.close();
      } else if (web3Provider && typeof web3Provider.disconnect === 'function') {
        await web3Provider.disconnect();
      }
      
      // Remove event listeners to prevent memory leaks
      if (web3Provider) {
        web3Provider.removeAllListeners();
      }
      
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error during wallet disconnect:', error);
      // Still clear local state even if disconnect fails
      setAccount(null);
      setChainId(null);
      web3.eth.defaultAccount = undefined;
    }
  };

  return (
    <Web3Context.Provider value={{ 
      account, 
      connect, 
      disconnect, 
      provider: web3Provider,
      web3,
      chainId
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);