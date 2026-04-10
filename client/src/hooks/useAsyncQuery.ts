import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAsyncQueryOptions {
  /**
   * When true, every fetch (including refetch) sets `loading` true.
   * When false, only the first load shows loading; refetches keep previous data visible.
   */
  showLoadingOnRefetch?: boolean;
}

/**
 * Runs an async query when `deps` change; supports manual `refetch` after mutations.
 */
export function useAsyncQuery<T>(
  fetchFn: () => Promise<T>,
  deps: readonly unknown[],
  options: UseAsyncQueryOptions = {},
): {
  data: T | null;
  error: string;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const { showLoadingOnRefetch = false } = options;
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  const hasDataRef = useRef(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const showSpinner = showLoadingOnRefetch || !hasDataRef.current;
    if (showSpinner) setLoading(true);
    setError("");
    try {
      const result = await fnRef.current();
      setData(result);
      hasDataRef.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [showLoadingOnRefetch]);

  useEffect(() => {
    let alive = true;
    const showSpinner = showLoadingOnRefetch || !hasDataRef.current;
    if (showSpinner) setLoading(true);
    setError("");
    (async () => {
      try {
        const result = await fnRef.current();
        if (!alive) return;
        setData(result);
        hasDataRef.current = true;
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        if (alive && showSpinner) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is the explicit cache key
  }, deps);

  return { data, error, loading, refetch };
}
