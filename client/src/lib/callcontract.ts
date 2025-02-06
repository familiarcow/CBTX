import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';
import type { Web3BaseProvider, TransactionReceipt } from 'web3-types';
import type { 
  ContractExecutionError, 
  TransactionRevertInstructionError,
  TransactionRevertedWithoutReasonError,
  TransactionRevertWithCustomError,
  InvalidResponseError,
  TransactionPollingTimeoutError
} from 'web3-errors';

// Router ABI for the specific functions we need
const ROUTER_ABI: AbiItem[] = [
  {
    inputs: [
      { name: 'vault', type: 'address' },
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'memo', type: 'string' },
      { name: 'expiry', type: 'uint256' },
    ],
    name: 'depositWithExpiry',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// ERC20 ABI for approvals
const ERC20_ABI: AbiItem[] = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

interface InboundAddress {
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

type Web3TransactionReceipt = {
  transactionHash: string;
  transactionIndex: bigint;
  blockHash: string;
  blockNumber: bigint;
  from: string;
  to: string;
  cumulativeGasUsed: bigint;
  gasUsed: bigint;
  contractAddress: string | null;
  logs: any[];
  status: bigint;
  logsBloom: string;
  effectiveGasPrice: bigint;
  type: bigint;
  events?: {
    [eventName: string]: {
      returnValues: any;
      raw: {
        data: string;
        topics: string[];
      };
      event: string;
      signature: string | null;
      logIndex: number;
      transactionIndex: number;
      transactionHash: string;
      blockHash: string;
      blockNumber: number;
      address: string;
    };
  };
};

interface TransactionEventCallbacks {
  onSending?: (payload: any) => void;
  onSent?: (payload: any) => void;
  onTransactionHash?: (hash: string) => void;
  onReceipt?: (receipt: TransactionReceipt) => void;
  onConfirmation?: (params: { confirmations: bigint; receipt: TransactionReceipt; latestBlockHash: string }) => void;
  onError?: (error: ContractExecutionError | 
    TransactionRevertInstructionError | 
    TransactionRevertedWithoutReasonError |
    TransactionRevertWithCustomError |
    InvalidResponseError |
    TransactionPollingTimeoutError
  ) => void;
}

export async function getRouterAddress(chain: string): Promise<string> {
  try {
    const response = await fetch('https://thornode.ninerealms.com/thorchain/inbound_addresses');
    const inboundAddresses: InboundAddress[] = await response.json();
    const chainData = inboundAddresses.find(addr => addr.chain === chain);
    
    if (!chainData) {
      throw new Error(`No router found for chain: ${chain}`);
    }
    
    return chainData.router;
  } catch (error) {
    console.error('Error fetching router address:', error);
    throw error;
  }
}

export async function approveERC20(
  web3: Web3,
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  fromAddress: string
) {
  console.log('Starting ERC20 approval process with params:', {
    tokenAddress,
    spenderAddress,
    amount,
    fromAddress
  });

  // Validate input parameters
  if (!web3) {
    throw new Error('Web3 instance is required');
  }
  if (!tokenAddress) {
    throw new Error('Token address is required');
  }
  if (!spenderAddress) {
    throw new Error('Spender address is required');
  }
  if (!amount) {
    throw new Error('Amount is required');
  }
  if (!fromAddress) {
    throw new Error('From address is required');
  }

  console.log('Creating token contract instance...');
  const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
  console.log('Token contract instance created');
  
  try {
    // Check current allowance
    console.log('Checking current allowance...');
    const currentAllowance: string = await tokenContract.methods
      .allowance(fromAddress, spenderAddress)
      .call();
    console.log('Current allowance:', currentAllowance);

    if (BigInt(currentAllowance) >= BigInt(amount)) {
      console.log('Sufficient allowance already exists');
      throw new Error('Sufficient allowance already exists');
    }

    console.log('Getting gas price for approval...');
    const gasPrice = await web3.eth.getGasPrice();
    console.log('Approval gas price:', gasPrice);

    // Send approve transaction
    console.log('Sending approve transaction...');
    const tx = await tokenContract.methods
      .approve(spenderAddress, amount)
      .send({
        from: fromAddress,
        gasPrice: gasPrice.toString(),
      });
    
    console.log('Approval transaction completed:', tx);
    return tx;
  } catch (error) {
    console.error('Error in approveERC20:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

export async function depositWithExpiry(
  web3: Web3,
  routerAddress: string,
  params: {
    vault: string;
    asset: string;
    amount: string;
    memo: string;
    fromAddress: string;
    value?: string;
  },
  callbacks?: TransactionEventCallbacks
): Promise<TransactionReceipt> {
  console.log('Starting depositWithExpiry with params:', {
    routerAddress,
    vault: params.vault,
    asset: params.asset,
    amount: params.amount,
    value: params.value,
    memo: params.memo,
    fromAddress: params.fromAddress
  });

  // Validate input parameters
  if (!web3) {
    throw new Error('Web3 instance is required');
  }
  if (!routerAddress) {
    throw new Error('Router address is required');
  }
  if (!params.vault) {
    throw new Error('Vault address is required');
  }
  if (!params.asset) {
    throw new Error('Asset address is required');
  }
  if (!params.fromAddress) {
    throw new Error('From address is required');
  }

  // For native token transactions, validate value
  const isNativeToken = params.asset === '0x0000000000000000000000000000000000000000';
  if (isNativeToken && !params.value) {
    throw new Error('Value is required for native token transactions');
  }

  // For token transactions, validate amount
  if (!isNativeToken && !params.amount) {
    throw new Error('Amount is required for token transactions');
  }

  // Validate amount/value format based on transaction type
  try {
    const amountToValidate = isNativeToken ? params.value! : params.amount;
    const amountBN = BigInt(amountToValidate);
    console.log('Amount validation in contract call:', {
      isNativeToken,
      originalAmount: amountToValidate,
      parsedAmount: amountBN.toString(),
      isValid: amountBN > 0
    });
    
    if (amountBN <= 0) {
      throw new Error('Amount must be greater than 0');
    }
  } catch (error) {
    console.error('Invalid amount format:', error);
    throw new Error(`Invalid amount format: ${isNativeToken ? params.value : params.amount}`);
  }

  console.log('Creating router contract instance...');
  const routerContract = new web3.eth.Contract(ROUTER_ABI, routerAddress);
  console.log('Router contract instance created');
  
  // Calculate expiry (current time + 60 minutes in seconds)
  const expiry = Math.floor(Date.now() / 1000) + 60 * 60;
  console.log('Calculated expiry timestamp:', expiry);

  try {
    // Estimate gas for the transaction
    console.log('Estimating gas...');
    const gasEstimate = await routerContract.methods
      .depositWithExpiry(
        params.vault,
        params.asset,
        params.amount,
        params.memo,
        expiry.toString()
      )
      .estimateGas({ 
        from: params.fromAddress,
        value: params.value || '0'
      });
    console.log('Gas estimation successful:', gasEstimate);

    console.log('Getting gas price...');
    const baseFeePerGas = await web3.eth.getGasPrice();
    console.log('Current base fee:', baseFeePerGas);

    // Calculate gas parameters (Base chain specific)
    const maxPriorityFeePerGas = web3.utils.toWei('0.001', 'gwei'); // 0.001 gwei priority fee
    const maxFeePerGas = (BigInt(baseFeePerGas) + BigInt(maxPriorityFeePerGas)).toString();
    
    // Use a more conservative gas limit (10% buffer instead of 20%)
    const finalGas = Math.floor(Number(gasEstimate) * 1.1).toString();
    
    console.log('Final transaction parameters:', {
      from: params.fromAddress,
      gas: finalGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      value: params.value || '0'
    });

    // Send the transaction with event handling
    console.log('Preparing to send transaction...');
    return new Promise((resolve, reject) => {
      console.log('Creating transaction...');
      
      const methodCall = routerContract.methods.depositWithExpiry(
        params.vault,
        params.asset,
        params.amount,
        params.memo,
        expiry.toString()
      );

      console.log('Transaction details:', {
        method: 'depositWithExpiry',
        parameters: {
          vault: params.vault,
          asset: params.asset,
          amount: params.amount,
          memo: params.memo,
          expiry: expiry.toString()
        },
        encodedCall: methodCall.encodeABI(),
        from: params.fromAddress,
        gas: finalGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        value: params.value || '0'
      });

      methodCall
        .send({
          from: params.fromAddress,
          gas: finalGas,
          value: params.value || '0',
          type: '0x2', // EIP-1559 transaction type
          maxFeePerGas,
          maxPriorityFeePerGas
        })
        .on('transactionHash', (hash: string) => {
          console.log('Transaction hash received:', hash);
          callbacks?.onTransactionHash?.(hash);
        })
        .on('receipt', (receipt: TransactionReceipt) => {
          console.log('Transaction receipt received:', receipt);
          callbacks?.onReceipt?.(receipt);
          resolve(receipt);
        })
        .on('error', (error: any) => {
          console.error('Transaction error:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            data: error.data,
            stack: error.stack
          });
          callbacks?.onError?.(error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error in depositWithExpiry:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

// Example usage:
/*
const executeSwap = async (
  web3: Web3,
  params: {
    chain: string;
    tokenAddress: string;
    amount: string;
    memo: string;
    fromAddress: string;
    vault: string;
  }
) => {
  // 1. Get router address
  const routerAddress = await getRouterAddress(params.chain);

  // 2. If ERC20, approve router to spend tokens
  if (params.tokenAddress !== '0x0000000000000000000000000000000000000000') {
    await approveERC20(
      web3,
      params.tokenAddress,
      routerAddress,
      params.amount,
      params.fromAddress
    );
  }

  // 3. Execute deposit with expiry
  try {
    const receipt = await depositWithExpiry(
      web3,
      routerAddress,
      {
        vault: params.vault,
        asset: params.tokenAddress,
        amount: params.amount,
        memo: params.memo,
        fromAddress: params.fromAddress,
      },
      {
        onSending: (payload) => {
          console.log('Sending transaction...', payload);
        },
        onTransactionHash: (hash) => {
          console.log('Transaction hash:', hash);
          // Here you can show the transaction hash to the user
        },
        onReceipt: (receipt) => {
          console.log('Transaction confirmed:', receipt);
        },
        onConfirmation: ({ confirmations, receipt, latestBlockHash }) => {
          console.log(`Confirmation ${confirmations}/24:`, { receipt, latestBlockHash });
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
        },
      }
    );

    return receipt;
  } catch (error) {
    console.error('Swap failed:', error);
    throw error;
  }
};
*/
