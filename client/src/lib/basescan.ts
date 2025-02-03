let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key;
}

const BASE_URL = 'https://api.basescan.org/api';

interface BasescanResponse {
  status: string;
  message: string;
  result: string;
}

export async function getTokenBalance(contractAddress: string, address: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API key not set');
  }

  const url = new URL(BASE_URL);
  url.searchParams.append('module', 'account');
  url.searchParams.append('action', 'tokenbalance');
  url.searchParams.append('contractaddress', contractAddress);
  url.searchParams.append('address', address);
  url.searchParams.append('tag', 'latest');
  url.searchParams.append('apikey', apiKey);

  console.log('Token balance URL:', url.toString());
  
  const response = await fetch(url.toString());
  const data: BasescanResponse = await response.json();
  
  console.log('Token balance response:', {
    contractAddress,
    address,
    data
  });
  
  if (data.status === "1") {
    return data.result;
  }
  throw new Error(data.message || `Failed to fetch balance for ${contractAddress}`);
}

export async function getEthBalance(address: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API key not set');
  }

  const url = new URL(BASE_URL);
  url.searchParams.append('module', 'account');
  url.searchParams.append('action', 'balance');
  url.searchParams.append('address', address);
  url.searchParams.append('tag', 'latest');
  url.searchParams.append('apikey', apiKey);

  console.log('ETH balance URL:', url.toString());
  
  const response = await fetch(url.toString());
  const data: BasescanResponse = await response.json();
  
  console.log('ETH balance response:', {
    address,
    data
  });
  
  if (data.status === "1") {
    return data.result;
  }
  throw new Error(data.message || 'Failed to fetch ETH balance');
} 