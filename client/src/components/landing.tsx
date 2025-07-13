import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
import { ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

// Import logos
import baseLogo from '../../images/base-logo.svg';
import btcLogo from '../../images/btc-logo.svg';

// Import chain logos
import btcChainLogo from '../../images/chain-logos/BTC.svg';
import ethChainLogo from '../../images/chain-logos/ETH.svg';
import bscChainLogo from '../../images/chain-logos/BSC.svg';
import bchChainLogo from '../../images/chain-logos/BCH.svg';
import ltcChainLogo from '../../images/chain-logos/LTC.svg';
import avaxChainLogo from '../../images/chain-logos/AVAX.svg';
import gaiaChainLogo from '../../images/chain-logos/GAIA.svg';
import dogeChainLogo from '../../images/chain-logos/DOGE.svg';
import thorChainLogo from '../../images/chain-logos/THOR.svg';

// Define chains for rotation
const CHAINS = [
  { name: 'Bitcoin', logo: btcChainLogo },
  { name: 'Ethereum', logo: ethChainLogo },
  { name: 'Avalanche', logo: avaxChainLogo },
  { name: 'Binance Smart Chain', logo: bscChainLogo },
  { name: 'Bitcoin Cash', logo: bchChainLogo },
  { name: 'Litecoin', logo: ltcChainLogo },
  { name: 'Dogecoin', logo: dogeChainLogo },
  { name: 'Cosmos', logo: gaiaChainLogo },
  { name: 'Thorchain', logo: thorChainLogo },
];

function RotatingChain() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CHAINS.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1.0]
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img 
            src={CHAINS[currentIndex].logo} 
            alt={CHAINS[currentIndex].name}
            className="h-full w-full object-contain"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function Landing() {
  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900 flex items-center justify-center flex-wrap">
            <span className="inline-flex items-center">
              From{" "}
              <img src={baseLogo} alt="Base" className="h-6 w-6 md:h-8 md:w-8 mx-1 md:mx-2" />
              Base
            </span>
            <span className="mx-2">→</span>
            <span className="inline-flex items-center">
              <RotatingChain />
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
            Open in App
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
} 