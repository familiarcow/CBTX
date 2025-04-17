import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
import { ArrowUpRight } from "lucide-react";

// Import logos
import baseLogo from '../../images/base-logo.svg';
import btcLogo from '../../images/btc-logo.svg';

export function Landing() {
  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
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
    </Card>
  );
} 