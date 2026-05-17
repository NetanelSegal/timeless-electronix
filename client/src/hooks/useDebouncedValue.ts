import { useEffect, useState } from "react";

type UseDebouncedValueOptions<T> = {
  /** First render value; defaults to `value`. Use e.g. current URL search to avoid an immediate sync. */
  initial?: T;
};

/** Returns `value` after it stops changing for `delayMs`. */
export function useDebouncedValue<T>(
  value: T,
  delayMs = 300,
  options?: UseDebouncedValueOptions<T>,
): T {
  const [debounced, setDebounced] = useState(
    () => options?.initial ?? value,
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
