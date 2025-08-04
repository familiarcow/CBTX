import React, { useEffect } from 'react'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { base } from 'wagmi/chains'
import { sdk } from '@farcaster/miniapp-sdk'

// Wagmi config for Base Mini App (simplified)
import { createConfig, http } from 'wagmi'

const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
})

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
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
              location: window.location.href
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

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
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