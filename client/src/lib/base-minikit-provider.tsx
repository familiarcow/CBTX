import React, { useEffect } from 'react'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { base } from 'wagmi/chains'
import { sdk } from '@farcaster/miniapp-sdk'

// Wagmi config for Base Mini App with proper RPC and connectors
import { createConfig, http } from 'wagmi'
import { coinbaseWallet, injected } from 'wagmi/connectors'

// Create Wagmi config with proper Base RPC endpoints
const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(), // For Base App built-in wallet
    coinbaseWallet({
      appName: 'FromBase.xyz',
      appLogoUrl: 'https://frombase.xyz/images/frombase-logo.png',
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org', {
      // Add retry and timeout configuration
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10000,
    }),
  },
  ssr: false,
})

console.log('🔧 Wagmi Config Debug:', {
  chains: wagmiConfig.chains.map(c => ({ id: c.id, name: c.name })),
  connectors: wagmiConfig.connectors.map(c => c.name),
  baseRPC: 'https://mainnet.base.org'
});

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000, // 1 minute
    },
  },
})

interface BaseMiniKitProviderProps {
  children: React.ReactNode
}

export function BaseMiniKitProvider({ children }: BaseMiniKitProviderProps) {
  useEffect(() => {
    // Initialize the Mini App SDK as required by Base docs
    const initMiniApp = async () => {
      try {
        // Check if we're in a Mini App environment
        if (typeof window !== 'undefined' && window.parent !== window) {
          if (import.meta.env.DEV) {
            console.log('🚀 Initializing Base Mini App...')
            console.log('Environment details:', {
              userAgent: navigator.userAgent,
              inIframe: window.parent !== window,
              location: window.location.href,
              wagmiConfig: 'Base RPC configured',
              onchainKitKey: !!import.meta.env.VITE_ONCHAINKIT_API_KEY
            })
          }
          // Call ready() to indicate the app is loaded
          await sdk.actions.ready()
          if (import.meta.env.DEV) {
            console.log('✅ Base Mini App ready!')
          }
        } else if (import.meta.env.DEV) {
          console.log('🌐 Running in regular browser mode')
        }
      } catch (error) {
        console.error('❌ Failed to initialize Mini App:', error)
      }
    }

    initMiniApp()
  }, [])

  // Debug RPC connectivity
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 RPC Debug - Testing Base connectivity...')
      fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('✅ RPC Test Success:', data)
      })
      .catch(error => {
        console.error('❌ RPC Test Failed:', error)
      })
    }
  }, [])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY || undefined}
          chain={base}
          config={{
            appearance: {
              mode: 'auto',
              theme: 'base',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 