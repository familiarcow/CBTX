import React from 'react';
import { useState, createContext, useContext } from "react";
import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";
import type { CoinbaseWalletProvider } from "@coinbase/wallet-sdk";
import Web3 from 'web3';

const APP_NAME = 'cbBTC Swap';
const APP_LOGO_URL = '';
const DEFAULT_CHAIN_ID = 8453;
const RPC_URL = 'https://base.blockpi.network/v1/rpc/public';
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

// Initialize provider outside component
const ethereum = coinbaseWallet.makeWeb3Provider(RPC_URL);

// Initialize Web3
const web3 = new Web3(ethereum);

interface Web3ContextType {
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: any; // Using any type for provider to avoid type conflicts
  web3: Web3;
  chainId: number | null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  connect: async () => {},
  disconnect: () => {},
  provider: null,
  web3,
  chainId: null
});

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [web3Provider, setWeb3Provider] = useState<CoinbaseWalletProvider | null>(ethereum);
  const [chainId, setChainId] = useState<number | null>(null);

  // Handle chain changes
  React.useEffect(() => {
    if (web3Provider) {
      web3Provider.on('chainChanged', (newChainId: string) => {
        setChainId(parseInt(newChainId));
      });
    }
    return () => {
      if (web3Provider) {
        web3Provider.removeListener('chainChanged', () => {});
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
      }
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  };

  const disconnect = () => {
    setAccount(null);
    setChainId(null);
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