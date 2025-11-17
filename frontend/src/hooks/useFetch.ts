import { useEffect, useState } from 'react';

export const useFetch = <T,>(fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const execute = async () => {
      setLoading(true);
      try {
        const result = await fetcher();
        if (mounted) {
          setData(result);
        }
      } catch (error) {
        if (mounted) {
          console.error('useFetch failed', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void execute();
    return () => {
      mounted = false;
    };
  }, [fetcher]);

  return { data, loading };
};
