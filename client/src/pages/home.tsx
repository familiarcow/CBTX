import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
import { SwapForm } from "@/components/swap-form";
import { TokenBalance } from "@/components/token-balance";
import { useWeb3 } from "@/lib/web3";

export default function Home() {
  const { account } = useWeb3();

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#0052FF]">
              Swap cbBTC to BTC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>

        {account && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Your Balances</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <TokenBalance symbol="ETH" />
                <TokenBalance symbol="USDC" />
                <TokenBalance symbol="cbBTC" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Swap</CardTitle>
              </CardHeader>
              <CardContent>
                <SwapForm />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
