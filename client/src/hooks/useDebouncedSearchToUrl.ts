import { useEffect } from "react";
import type { SetURLSearchParams } from "react-router-dom";

/**
 * After `delayMs`, sync trimmed `searchInput` to the URL search param and reset `page` to 1.
 * Skips when trimmed input already matches `urlSearch`. Uses `replace: true`.
 */
export function useDebouncedSearchToUrl(options: {
  searchInput: string;
  urlSearch: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  delayMs?: number;
  paramKey?: string;
}): void {
  const {
    searchInput,
    urlSearch,
    searchParams,
    setSearchParams,
    delayMs = 350,
    paramKey = "search",
  } = options;

  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      if (q === urlSearch) return;
      const next = new URLSearchParams(searchParams);
      if (q) next.set(paramKey, q);
      else next.delete(paramKey);
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }, delayMs);
    return () => clearTimeout(t);
  }, [
    searchInput,
    urlSearch,
    searchParams,
    setSearchParams,
    delayMs,
    paramKey,
  ]);
}
