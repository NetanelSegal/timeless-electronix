import type { ColumnSizingState, OnChangeFn } from "@tanstack/react-table";
import { useCallback, useState } from "react";

const STORAGE_KEY = "te-admin-product-table-col-sizes";

function readSizing(): ColumnSizingState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object" || Array.isArray(p)) return {};
    const out: ColumnSizingState = {};
    for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function useAdminProductsTableColumnSizing() {
  const [columnSizing, setColumnSizingState] = useState<ColumnSizingState>(
    () => (typeof window !== "undefined" ? readSizing() : {}),
  );

  const onColumnSizingChange: OnChangeFn<ColumnSizingState> = useCallback(
    (updater) => {
      setColumnSizingState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (old: ColumnSizingState) => ColumnSizingState)(prev)
            : updater;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  return { columnSizing, onColumnSizingChange };
}
