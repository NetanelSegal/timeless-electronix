import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "te-admin-product-table-cols";

export type AdminProductTableColumns = {
  showSummary: boolean;
  showDescription: boolean;
};

const DEFAULTS: AdminProductTableColumns = {
  showSummary: true,
  showDescription: true,
};

function readCols(): AdminProductTableColumns {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<AdminProductTableColumns>;
    return {
      showSummary: p.showSummary !== false,
      showDescription: p.showDescription !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useAdminProductsColumnVisibility() {
  const [cols, setCols] = useState<AdminProductTableColumns>(DEFAULTS);

  useEffect(() => {
    setCols(readCols());
  }, []);

  const setShowSummary = useCallback((v: boolean) => {
    setCols((c) => {
      const next = { ...c, showSummary: v };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setShowDescription = useCallback((v: boolean) => {
    setCols((c) => {
      const next = { ...c, showDescription: v };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { cols, setShowSummary, setShowDescription };
}
