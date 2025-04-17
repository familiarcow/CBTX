import { useState, useEffect } from 'react';
import type { Address } from 'viem';
import { getBasename, type Basename } from '../lib/basenames';

export function useBasename(address: Address | null | undefined) {
  const [basename, setBasename] = useState<Basename | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setBasename(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchBasename = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const name = await getBasename(address);
        setBasename(name || null);
      } catch (err) {
        console.error('Error fetching basename:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch basename'));
      } finally {
        setLoading(false);
      }
    };

    fetchBasename();
  }, [address]);

  return { basename, loading, error };
} 