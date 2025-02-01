const THORNODE_URL = "https://thornode.ninerealms.com";

interface QuoteParams {
  amount: string;
  fromAsset: string;
  toAsset: string;
  destinationAddress: string;
}

interface QuoteResponse {
  expected_amount_out: string;
  memo: string;
  inbound_address: string;
  expiry: number;
}

export async function getSwapQuote({
  amount,
  fromAsset,
  toAsset,
  destinationAddress,
}: QuoteParams): Promise<QuoteResponse> {
  const params = new URLSearchParams({
    amount,
    from_asset: fromAsset,
    to_asset: toAsset,
    destination: destinationAddress,
    streaming_interval: "1",
    streaming_quantity: "0",
  });

  const response = await fetch(
    `${THORNODE_URL}/thorchain/quote/swap?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch swap quote");
  }

  return response.json();
}
