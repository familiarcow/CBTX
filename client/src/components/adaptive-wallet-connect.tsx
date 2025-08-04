import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { useBasename } from '@/hooks/use-basename'

// Import logos
import baseLogo from '../../images/base-logo.svg'
import btcLogo from '../../images/btc-logo.svg'

// Legacy imports for regular mode
import { useWeb3 } from "@/hooks/use-web3-compat"

function useWagmiSafely() {
  try {
    const account = useAccount()
    const connect = useConnect()
    const disconnect = useDisconnect()
    return { account, connect, disconnect, hasWagmi: true }
  } catch (error) {
    // wagmi not available, return null values
    return { 
      account: { address: null, isConnected: false }, 
      connect: { connect: () => {}, connectors: [], error: null, isPending: false },
      disconnect: { disconnect: () => {} },
      hasWagmi: false 
    }
  }
}

export function AdaptiveWalletConnect() {
  const { account, connect, disconnect, hasWagmi } = useWagmiSafely()
  const legacyWallet = useWeb3() // Fallback for regular mode
  
  // Determine which wallet system to use
  const isConnected = hasWagmi ? account.isConnected : !!legacyWallet.account
  const address = hasWagmi ? account.address : legacyWallet.account
  const { basename, loading: basenameLoading } = useBasename(address as `0x${string}` | null)

  const getBaseScanUrl = (address: string) => {
    return `https://basescan.org/address/${address}`
  }

  // Check if we're in a Mini App environment
  const isMiniApp = typeof window !== 'undefined' && 
    (window.parent !== window || window.location.search.includes('miniapp=true'))

  const handleConnect = async () => {
    if (hasWagmi && connect.connectors.length > 0) {
      // Use wagmi in Mini App mode
      const connector = connect.connectors[0]
      connect.connect({ connector })
    } else {
      // Use legacy connection in regular mode
      await legacyWallet.connect()
    }
  }

  const handleDisconnect = async () => {
    if (hasWagmi) {
      disconnect.disconnect()
    } else {
      await legacyWallet.disconnect()
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <div className="text-sm text-gray-600">
            Connected{isMiniApp ? ' via Base App' : ''}: 
            <a 
              href={getBaseScanUrl(address)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 font-medium text-[#0052FF] hover:text-[#0052FF]/80 transition-colors inline-flex items-center gap-1"
            >
              {basenameLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : basename ? (
                basename
              ) : (
                `${address.slice(0, 6)}...${address.slice(-4)}`
              )}
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
            onClick={handleDisconnect}
            className="rounded-xl border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            Disconnect
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm mb-6">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <div className="mb-6 flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900 flex items-center justify-center flex-wrap">
            <span className="inline-flex items-center">
              From{" "}
              <img src={baseLogo} alt="Base" className="h-6 w-6 md:h-8 md:w-8 mx-1 md:mx-2" />
              Base
            </span>
            <span className="mx-2">→</span>
            <span className="inline-flex items-center">
              <img src={btcLogo} alt="Bitcoin" className="h-6 w-6 md:h-8 md:w-8 mx-1 md:mx-2" />
              Bitcoin
            </span>
          </h1>
          <p className="text-gray-600 text-center">
            {isMiniApp 
              ? "Swap your Base assets using Base App's built-in wallet"
              : "Swap your Base assets to Bitcoin and other chains"
            }
          </p>
        </div>
        
        {(connect.error) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            Connection error: {connect.error.message}
          </div>
        )}
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-md"
        >
          <Button
            onClick={handleConnect}
            disabled={connect.isPending}
            className="w-full bg-[#0052FF] hover:bg-[#0039B3] text-white font-semibold py-6 px-8 rounded-xl shadow-lg transition-all duration-300"
          >
            {connect.isPending 
              ? 'Connecting...' 
              : isMiniApp 
                ? 'Connect Base App Wallet'
                : 'Connect Coinbase Wallet'
            }
          </Button>
        </motion.div>

        {!isMiniApp && (
          <div className="mt-4 text-gray-500 text-sm">
            <p>Or access via Base App for seamless wallet integration</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 