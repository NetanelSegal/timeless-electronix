import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { QuoteItem } from "../lib/types";

function normalizeStoredItems(raw: unknown): QuoteItem[] {
  if (!Array.isArray(raw)) return [];
  const out: QuoteItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (typeof o.productId !== "string" || !o.productId.trim()) continue;
    const qty =
      typeof o.quantity === "number" &&
      Number.isFinite(o.quantity) &&
      o.quantity >= 1
        ? Math.min(Math.floor(o.quantity), 1_000_000_000)
        : 1;
    out.push({
      productId: o.productId,
      partNumber: typeof o.partNumber === "string" ? o.partNumber : "",
      manufacturer: typeof o.manufacturer === "string" ? o.manufacturer : "",
      quantity: qty,
      ourReference:
        typeof o.ourReference === "string" ? o.ourReference : "",
    });
  }
  return out;
}

interface QuoteContextValue {
  items: QuoteItem[];
  addItem: (item: QuoteItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearItems: () => void;
  itemCount: number;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

const STORAGE_KEY = "timeless-quote-items";

function loadFromStorage(): QuoteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeStoredItems(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: QuoteItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === item.productId)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      );
    },
    [],
  );

  const clearItems = useCallback(() => setItems([]), []);

  return (
    <QuoteContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearItems,
        itemCount: items.length,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote(): QuoteContextValue {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used within QuoteProvider");
  return ctx;
}
