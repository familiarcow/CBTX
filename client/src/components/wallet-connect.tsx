import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/lib/web3";
import { SiCoinbase } from "react-icons/si";

export function WalletConnect() {
  const { account, connect, disconnect } = useWeb3();

  if (account) {
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </div>
        <Button variant="outline" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      className="w-full md:w-auto bg-[#0052FF] hover:bg-[#0052FF]/90"
      onClick={connect}
    >
      <SiCoinbase className="mr-2 h-4 w-4" />
      Connect Coinbase Wallet
    </Button>
  );
}
