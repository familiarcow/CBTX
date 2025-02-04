import React from 'react';
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/lib/web3";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import coinbaseLogo from "/images/coinbase_wallet_logo.png";

export function WalletConnect() {
  const { connect, disconnect, account } = useWeb3();

  const getBaseScanUrl = (address: string) => {
    return `https://basescan.org/address/${address}`;
  };

  if (account) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <div className="text-sm text-gray-600">
            Connected: 
            <a 
              href={getBaseScanUrl(account)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 font-medium text-[#0052FF] hover:text-[#0052FF]/80 transition-colors inline-flex items-center gap-1"
            >
              {account.slice(0, 6)}...{account.slice(-4)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            variant="outline" 
            onClick={disconnect}
            className="rounded-xl border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            Disconnect
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={connect}
        className="bg-[#0052FF] hover:bg-[#0039B3] text-white font-semibold py-6 px-8 rounded-xl shadow-lg transition-all duration-300 flex items-center gap-3"
      >
        <img 
          src={coinbaseLogo} 
          alt="Coinbase Wallet" 
          className="w-6 h-6"
        />
        Connect Coinbase Wallet
      </Button>
    </motion.div>
  );
}
