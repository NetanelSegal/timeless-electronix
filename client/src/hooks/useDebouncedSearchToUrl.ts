import { useEffect } from "react";
import type { SetURLSearchParams } from "react-router-dom";
import { useDebouncedValue } from "./useDebouncedValue";

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

  const debouncedSearch = useDebouncedValue(searchInput.trim(), delayMs, {
    initial: urlSearch,
  });

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set(paramKey, debouncedSearch);
    else next.delete(paramKey);
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  }, [
    debouncedSearch,
    urlSearch,
    searchParams,
    setSearchParams,
    paramKey,
  ]);
}
