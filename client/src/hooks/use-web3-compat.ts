import { useWeb3 as useWeb3Original } from '@/lib/web3'

/**
 * Compatibility hook for components that still use the old useWeb3 API
 * This is for the legacy Web3Provider mode (regular browser)
 */
export function useWeb3() {
  const web3Context = useWeb3Original()
  
  return {
    account: web3Context.account,
    web3: web3Context.web3,
    provider: web3Context.provider,
    chainId: web3Context.chainId,
    connect: web3Context.connect,
    disconnect: web3Context.disconnect
  }
} 