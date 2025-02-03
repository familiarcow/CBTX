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

// Initialize outside component to prevent re-initialization
const coinbaseWallet = new CoinbaseWalletSDK({
  appName: APP_NAME,
  appLogoUrl: APP_LOGO_URL,
  darkMode: false
});

// Initialize provider outside component
const ethereum = coinbaseWallet.makeWeb3Provider();

// Initialize Web3
const web3 = new Web3(ethereum as any);

interface Web3ContextType {
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: CoinbaseWalletProvider | null;
  web3: Web3;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  connect: async () => {},
  disconnect: () => {},
  provider: null,
  web3: web3
});

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [web3Provider, setWeb3Provider] = useState<CoinbaseWalletProvider | null>(ethereum);

  const connect = async () => {
    try {
      if (!web3Provider) return;
      const accounts = await web3Provider.request({ method: "eth_requestAccounts" });
      if (Array.isArray(accounts) && accounts[0]) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };
  const disconnect = () => {
    setAccount(null);
  };

  return (
    <Web3Context.Provider value={{ 
      account, 
      connect, 
      disconnect, 
      provider: web3Provider,
      web3 
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);