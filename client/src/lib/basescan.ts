let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key;
}

// Updated to use Etherscan API v2 for Base chain
const BASE_URL = 'https://api.etherscan.io/v2/api';
const CHAIN_ID = '8453'; // Base chain ID

interface BasescanResponse {
  status: string;
  message: string;
  result: string;
}

// Rate limiting implementation with better error handling
interface QueuedRequest {
  url: string;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  retries: number;
  maxRetries: number;
}

class RateLimiter {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 600; // 600ms between requests to be safer
  private backoffMultiplier = 1;
  private maxBackoff = 10000; // 10 seconds max backoff

  async makeRequest(url: string, maxRetries: number = 3): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, resolve, reject, retries: 0, maxRetries });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const actualInterval = this.minInterval * this.backoffMultiplier;

      if (timeSinceLastRequest < actualInterval) {
        await new Promise(resolve => setTimeout(resolve, actualInterval - timeSinceLastRequest));
      }

      const request = this.queue.shift();
      if (!request) break;

      try {
        this.lastRequestTime = Date.now();
        const response = await fetch(request.url);
        const data: BasescanResponse = await response.json();
        
        if (data.status === "1") {
          // Success - reset backoff
          this.backoffMultiplier = 1;
          request.resolve(data.result);
        } else {
          // Handle specific error cases
          if (data.message === "NOTOK") {
            if (data.result && data.result.includes("Too many invalid api key attempts")) {
              throw new Error("API key validation failed - please check your API key");
            } else if (data.result && data.result.includes("rate limit")) {
              throw new Error("Rate limit exceeded - please try again later");
            } else {
              throw new Error(data.result || "API request failed");
            }
          }
          throw new Error(data.message || 'API request failed');
        }
      } catch (error) {
        console.error(`API request failed (attempt ${request.retries + 1}):`, error);
        
        // Check if it's a rate limit or API key error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isRateLimitError = errorMessage.includes('rate limit') || errorMessage.includes('Too many');
        const isAPIKeyError = errorMessage.includes('invalid api key');
        
        if (isRateLimitError) {
          // Increase backoff for rate limit errors
          this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, this.maxBackoff / this.minInterval);
        }
        
        if (isAPIKeyError || request.retries >= request.maxRetries) {
          // Don't retry API key errors or if max retries reached
          request.reject(error instanceof Error ? error : new Error('Unknown error'));
        } else {
          // Retry the request
          request.retries++;
          this.queue.unshift(request); // Put back at front of queue
          
          // Add extra delay for retries
          await new Promise(resolve => setTimeout(resolve, 1000 * request.retries));
        }
      }
    }

    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

export async function getTokenBalance(contractAddress: string, address: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API key not set');
  }

  const url = new URL(BASE_URL);
  url.searchParams.append('chainid', CHAIN_ID);
  url.searchParams.append('module', 'account');
  url.searchParams.append('action', 'tokenbalance');
  url.searchParams.append('contractaddress', contractAddress);
  url.searchParams.append('address', address);
  url.searchParams.append('tag', 'latest');
  url.searchParams.append('apikey', apiKey);

  console.log('Token balance URL:', url.toString());
  
  try {
    const result = await rateLimiter.makeRequest(url.toString());
    console.log('Token balance response:', {
      contractAddress,
      address,
      result
    });
    return result;
  } catch (error) {
    console.error(`Error fetching token balance for ${contractAddress}:`, error);
    throw error;
  }
}

export async function getEthBalance(address: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API key not set');
  }

  const url = new URL(BASE_URL);
  url.searchParams.append('chainid', CHAIN_ID);
  url.searchParams.append('module', 'account');
  url.searchParams.append('action', 'balance');
  url.searchParams.append('address', address);
  url.searchParams.append('tag', 'latest');
  url.searchParams.append('apikey', apiKey);

  console.log('ETH balance URL:', url.toString());
  
  try {
    const result = await rateLimiter.makeRequest(url.toString());
    console.log('ETH balance response:', {
      address,
      result
    });
    return result;
  } catch (error) {
    console.error(`Error fetching ETH balance:`, error);
    throw error;
  }
} 