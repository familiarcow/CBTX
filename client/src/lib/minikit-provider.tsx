import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Web3 from 'web3'

// Types for MiniKit integration
interface MiniKitContextType {
  // Connection state
  isConnected: boolean
  address: string | null
  chainId: number | null
  
  // Connection methods
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  // Web3 instance
  web3: Web3 | null
  provider: any
  
  // Transaction methods
  sendTransaction: (params: any) => Promise<string>
}

const MiniKitContext = createContext<MiniKitContextType>({
  isConnected: false,
  address: null,
  chainId: null,
  connect: async () => {},
  disconnect: async () => {},
  web3: null,
  provider: null,
  sendTransaction: async () => ''
})

function MiniKitProviderInner({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [web3Instance, setWeb3Instance] = useState<Web3 | null>(null)
  const [provider, setProvider] = useState<any>(null)

  // Check if we're running in Base App
  const isInBaseApp = useCallback(() => {
    return typeof window !== 'undefined' && 
           (window as any).ethereum?.isMiniKit || 
           window.parent !== window
  }, [])

  // Initialize MiniKit connection
  useEffect(() => {
    const initMiniKit = async () => {
      try {
        // Always try to get ethereum provider (works in browser too)
        const ethereum = (window as any).ethereum
        if (ethereum) {
          setProvider(ethereum)
          const web3 = new Web3(ethereum)
          setWeb3Instance(web3)

          // Check if already connected
          const accounts = await ethereum.request({ method: 'eth_accounts' })
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)
            
            // Get chain ID
            const currentChainId = await ethereum.request({ method: 'eth_chainId' })
            setChainId(parseInt(currentChainId, 16))
          }

          // Listen for account changes
          ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length > 0) {
              setAddress(accounts[0])
              setIsConnected(true)
            } else {
              setAddress(null)
              setIsConnected(false)
            }
          })

          // Listen for chain changes
          ethereum.on('chainChanged', (newChainId: string) => {
            setChainId(parseInt(newChainId, 16))
          })
        }
      } catch (error) {
        console.error('Failed to initialize MiniKit:', error)
      }
    }

    initMiniKit()
  }, [])

  const connect = useCallback(async () => {
    try {
      if (!provider) {
        throw new Error('No wallet provider available')
      }

      // Request account access
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)
        
        // Get chain ID
        const currentChainId = await provider.request({ method: 'eth_chainId' })
        setChainId(parseInt(currentChainId, 16))
        
        console.log('Connected to Base App wallet:', accounts[0])
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }, [provider])

  const disconnect = useCallback(async () => {
    try {
      // Clear local state
      setAddress(null)
      setIsConnected(false)
      setChainId(null)
      
      console.log('Disconnected from Base App wallet')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }, [])

  const sendTransaction = useCallback(async (params: any) => {
    if (!provider || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ ...params, from: address }]
      })
      
      console.log('Transaction sent:', txHash)
      return txHash
    } catch (error) {
      console.error('Failed to send transaction:', error)
      throw error
    }
  }, [provider, address])

  const value: MiniKitContextType = {
    isConnected,
    address,
    chainId,
    connect,
    disconnect,
    web3: web3Instance,
    provider,
    sendTransaction
  }

  return (
    <MiniKitContext.Provider value={value}>
      {children}
    </MiniKitContext.Provider>
  )
}

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function MiniKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MiniKitProviderInner>
        {children}
      </MiniKitProviderInner>
    </QueryClientProvider>
  )
}

export const useMiniKit = () => useContext(MiniKitContext)

// Make compatibility hooks available at the library level for component imports
export function useWeb3() {
  const miniKit = useMiniKit()
  
  return {
    account: miniKit.address,
    web3: miniKit.web3,
    provider: miniKit.provider,
    chainId: miniKit.chainId,
    connect: miniKit.connect,
    disconnect: miniKit.disconnect
  }
}

export function useWallet() {
  const miniKit = useMiniKit()
  
  return {
    isConnected: miniKit.isConnected,
    address: miniKit.address,
    chainId: miniKit.chainId,
    walletType: 'minikit' as const,
    connectCoinbase: miniKit.connect,
    connectWagmi: miniKit.connect,
    connectFarcaster: miniKit.connect,
    disconnect: miniKit.disconnect,
    web3: miniKit.web3,
    provider: miniKit.provider,
    wagmiAccount: null,
    wagmiConnectors: [] as const
  }
} 