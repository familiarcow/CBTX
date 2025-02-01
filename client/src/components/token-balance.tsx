import { useEffect, useState } from "react";
import { useWeb3 } from "@/lib/web3";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TOKEN_ADDRESSES = {
  ETH: "0x0000000000000000000000000000000000000000",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  cbBTC: "0xcBB7C0000AB88b473b1F5afd9Ef808440eED33bF",
};

export function TokenBalance({ symbol }: { symbol: keyof typeof TOKEN_ADDRESSES }) {
  const { provider, account } = useWeb3();
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      if (!provider || !account) return;
      try {
        const balance = await provider.request({
          method: "eth_getBalance",
          params: [account, "latest"],
        });
        setBalance(balance);
      } catch (error) {
        console.error(`Error fetching ${symbol} balance:`, error);
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [provider, account, symbol]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-600">{symbol}</div>
        {loading ? (
          <Skeleton className="h-6 w-24 mt-1" />
        ) : (
          <div className="text-lg font-medium">{balance}</div>
        )}
      </CardContent>
    </Card>
  );
}
