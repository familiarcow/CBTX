// Constants for the swap
import Web3 from 'web3';
export const THOR_NODE_URL = 'https://thornode.ninerealms.com';
export const CBBTC_ADDRESS = '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf';

// Calculate minimum output amount based on expected amount and slip tolerance
export const calculateMinOutput = (expectedAmountOut: string, slipTolerance: number): string => {
  return Math.floor(((10000 - slipTolerance) * Number(expectedAmountOut)) / 10000).toString();
};

// Types for the quote response
export interface QuoteFees {
  asset: string;
  affiliate: string;
  outbound: string;
  liquidity: string;
  total: string;
  slippage_bps: number;
  total_bps: number;
}

export interface QuoteResponse {
  inbound_address: string;
  inbound_confirmation_blocks: number;
  inbound_confirmation_seconds: number;
  outbound_delay_blocks: number;
  outbound_delay_seconds: number;
  fees: QuoteFees;
  router: string;
  expiry: number;
  warning: string;
  notes: string;
  recommended_min_amount_in: string;
  recommended_gas_rate: string;
  gas_rate_units: string;
  memo: string;
  expected_amount_out: string;
  max_streaming_quantity: number;
  streaming_swap_blocks: number;
  streaming_swap_seconds: number;
  total_swap_seconds: number;
  input_amount: string;
}

export interface GetQuoteParams {
  amount: string | number;
  fromAsset?: string;  // Optional as we'll default to cbBTC
  toAsset?: string;    // Optional as we'll default to BTC
  destinationAddress: string;
  streamingInterval?: number;
  streamingQuantity?: number;
  slipTolerance?: number; // Added for price limit calculation
}

export const getSwapQuote = async ({
  amount,
  fromAsset = `BASE.CBBTC-${CBBTC_ADDRESS.toUpperCase()}`,
  toAsset = 'BTC.BTC',
  destinationAddress,
  streamingInterval = 1,
  streamingQuantity = 0,
  slipTolerance = 300 // Default 3%
}: GetQuoteParams): Promise<QuoteResponse> => {
  try {
    // Convert amount to number and multiply by 1e8
    const amountInBaseUnits = (Number(amount) * 1e8).toString();

    const params = new URLSearchParams({
      amount: amountInBaseUnits,
      from_asset: fromAsset,
      to_asset: toAsset,
      destination: destinationAddress,
      streaming_interval: streamingInterval.toString(),
      streaming_quantity: streamingQuantity.toString(),
      affiliate: "-",
      affiliate_bps: "8"
    });

    const response = await fetch(`${THOR_NODE_URL}/thorchain/quote/swap?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get quote: ${response.statusText}`);
    }

    const data: QuoteResponse = await response.json();
    
    // Update the memo with price limit
    data.memo = updateMemoWithPriceLimit(data.memo, data.expected_amount_out, slipTolerance);
    
    // Add the input amount to the response
    data.input_amount = amountInBaseUnits;
    
    return data;
  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
};

/**
 * Updates the memo field by replacing the first number before the first slash
 * with a calculated price limit based on slip tolerance
 */
export const updateMemoWithPriceLimit = (
  memo: string,
  expectedAmountOut: string,
  slipTolerance: number
): string => {
  // Calculate price limit
  const priceLimit = Math.floor(
    ((10000 - slipTolerance) * Number(expectedAmountOut)) / 10000
  ).toString();

  // Replace the first number before the first slash
  // This regex looks for a number followed by a slash, ensuring we only replace the first occurrence
  return memo.replace(/(\d+)(\/)/, `${priceLimit}$2`);
};

export interface InboundAddress {
  chain: string;
  pub_key: string;
  address: string;
  router: string;
  halted: boolean;
  global_trading_paused: boolean;
  chain_trading_paused: boolean;
  chain_lp_actions_paused: boolean;
  gas_rate: string;
  gas_rate_units: string;
  outbound_tx_size: string;
  outbound_fee: string;
  dust_threshold: string;
}

// Function to fetch inbound addresses
export async function getInboundAddresses(): Promise<InboundAddress[]> {
  const response = await fetch(`${THOR_NODE_URL}/thorchain/inbound_addresses`);
  if (!response.ok) {
    throw new Error('Failed to fetch inbound addresses');
  }
  return response.json();
}

// Function to check if token is approved
export async function checkTokenApproval(
  web3: Web3,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  amount: string
): Promise<boolean> {
  const tokenContract = new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [
          { name: '_owner', type: 'address' },
          { name: '_spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function'
      }
    ],
    tokenAddress
  );

  const allowance = await tokenContract.methods
    .allowance(ownerAddress, spenderAddress)
    .call() as string;

  return BigInt(allowance) >= BigInt(amount);
}

// Function to approve token spending
export async function approveToken(
  web3: Web3,
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): Promise<string> {
  const tokenContract = new web3.eth.Contract(
    [
      {
        constant: false,
        inputs: [
          { name: '_spender', type: 'address' },
          { name: '_value', type: 'uint256' }
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function'
      }
    ],
    tokenAddress
  );

  const accounts = await web3.eth.getAccounts();
  const from = accounts[0];

  const tx = await tokenContract.methods
    .approve(spenderAddress, amount)
    .send({ from });

  return tx.transactionHash;
}

// Function to create and send the deposit transaction
export async function sendDepositTransaction(
  web3: Web3,
  params: {
    vault: string;
    router: string;
    asset: string;
    amount: string;
    memo: string;
  }
): Promise<string> {
  const routerContract = new web3.eth.Contract(
    [
      {
        inputs: [
          { name: 'vault', type: 'address' },
          { name: 'asset', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'memo', type: 'string' },
          { name: 'expiry', type: 'uint256' }
        ],
        name: 'depositWithExpiry',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    params.router
  );

  const accounts = await web3.eth.getAccounts();
  const from = accounts[0];

  // Set expiry to 15 minutes from now
  const expiry = Math.floor(Date.now() / 1000) + 900;

  // Extract token address from the asset string (e.g., "BASE.CBBTC-0XCBB7C0000AB88B473B1F5AFD9EF808440EED33BF")
  const tokenAddress = '0x' + params.asset.split('-')[1].slice(2).toLowerCase();

  const tx = await routerContract.methods
    .depositWithExpiry(
      params.vault,
      tokenAddress,
      params.amount,
      params.memo,
      expiry
    )
    .send({ from });

  return tx.transactionHash;
}
