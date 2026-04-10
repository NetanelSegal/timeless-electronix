import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { ProductsResponse } from "../lib/types";

const CATALOG_SORT_FIELDS = [
  "quantity",
  "partNumber",
  "manufacturer",
  "updatedAt",
] as const;

const FIELD_DEFAULT_ORDER: Record<string, "asc" | "desc"> = {
  quantity: "desc",
  partNumber: "asc",
  manufacturer: "asc",
  updatedAt: "desc",
};

export const CATALOG_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "quantity:desc", label: "Stock (high to low)" },
  { value: "quantity:asc", label: "Stock (low to high)" },
  { value: "partNumber:asc", label: "Part number (A–Z)" },
  { value: "partNumber:desc", label: "Part number (Z–A)" },
  { value: "manufacturer:asc", label: "Manufacturer (A–Z)" },
  { value: "manufacturer:desc", label: "Manufacturer (Z–A)" },
  { value: "updatedAt:desc", label: "Recently updated" },
  { value: "updatedAt:asc", label: "Oldest updated first" },
];

/** Effective sort for API + UI, matching server whitelist and defaults. */
export function effectiveCatalogSort(searchParams: URLSearchParams): {
  field: string;
  order: "asc" | "desc";
  presetValue: string;
} {
  const raw = searchParams.get("sort")?.trim();
  const field =
    raw &&
    (CATALOG_SORT_FIELDS as readonly string[]).includes(raw)
      ? raw
      : "quantity";
  const o = searchParams.get("order")?.toLowerCase();
  const order: "asc" | "desc" =
    o === "asc" || o === "desc" ? o : FIELD_DEFAULT_ORDER[field] ?? "desc";
  return {
    field,
    order,
    presetValue: `${field}:${order}`,
  };
}

/**
 * Catalog URL params, manufacturer list, product list, and handlers.
 */
export function useCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const manufacturer = searchParams.get("manufacturer") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page =
    Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;

  const { field: sortField, order: sortOrder, presetValue } =
    effectiveCatalogSort(searchParams);

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    api
      .get<string[]>("/products/manufacturers")
      .then(setManufacturers)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (manufacturer) params.set("manufacturer", manufacturer);
    params.set("page", String(page));
    params.set("limit", "24");
    params.set("sort", sortField);
    params.set("order", sortOrder);

    api
      .get<ProductsResponse>(`/products?${params}`)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, manufacturer, page, sortField, sortOrder]);

  useEffect(() => {
    if (!products || products.totalPages < 1) return;
    if (page > products.totalPages) {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(products.totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [products, page, searchParams, setSearchParams]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      next.set("search", searchInput.trim());
    } else {
      next.delete("search");
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const setMfg = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set("manufacturer", val);
    } else {
      next.delete("manufacturer");
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const setSortPreset = (preset: string) => {
    const colon = preset.indexOf(":");
    if (colon < 0) return;
    const field = preset.slice(0, colon);
    const ord = preset.slice(colon + 1);
    if (!field || (ord !== "asc" && ord !== "desc")) return;
    const next = new URLSearchParams(searchParams);
    if (field === "quantity" && ord === "desc") {
      next.delete("sort");
      next.delete("order");
    } else {
      next.set("sort", field);
      next.set("order", ord);
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    search,
    manufacturer,
    page,
    sortPresetValue: presetValue,
    searchInput,
    setSearchInput,
    manufacturers,
    products,
    loading,
    handleSearch,
    setMfg,
    setSortPreset,
    goToPage,
  };
}
