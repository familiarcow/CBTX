import { useState, useEffect, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FarcasterUser {
  fid: number;
  token?: string;
}

interface UseFarcasterAuthReturn {
  user: FarcasterUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export function useFarcasterAuth(): UseFarcasterAuthReturn {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { token } = await sdk.quickAuth.getToken();
      
      // Decode the JWT to get user info (without verification - this is just for display)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      setUser({
        fid: payload.sub,
        token
      });
    } catch (err) {
      console.error('Farcaster auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!user?.token) {
      throw new Error('No authentication token available');
    }

    return sdk.quickAuth.fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${user.token}`
      }
    });
  }, [user?.token]);

  // Check for existing token on mount
  useEffect(() => {
    const existingToken = sdk.quickAuth.token;
    if (existingToken) {
      try {
        const payload = JSON.parse(atob(existingToken.split('.')[1]));
        setUser({
          fid: payload.sub,
          token: existingToken
        });
      } catch (err) {
        console.error('Error parsing existing token:', err);
      }
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    authenticatedFetch
  };
} 