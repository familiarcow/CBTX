import { useState, useEffect, createContext, useContext } from "react";
import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";
import type { CoinbaseWalletProvider } from "@coinbase/wallet-sdk";

interface Web3ContextType {
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: CoinbaseWalletProvider | null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  connect: async () => {},
  disconnect: () => {},
  provider: null,
});

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<CoinbaseWalletProvider | null>(null);

  const coinbaseWallet = new CoinbaseWalletSDK({
    appName: "cbBTC Swap",
    appLogoUrl: "",
  });

  useEffect(() => {
    const ethereum = coinbaseWallet.makeWeb3Provider(
      "https://base.blockpi.network/v1/rpc/public",
      8453
    );
    setProvider(ethereum);
  }, []);

  const connect = async () => {
    try {
      if (!provider) return;
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (Array.isArray(accounts) && accounts[0]) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const disconnect = () => {
    coinbaseWallet.disconnect();
    setAccount(null);
  };

  return (
    <Web3Context.Provider value={{account, connect, disconnect, provider}}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);