import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { effectiveListSort, parsePageFromSearchParams } from "../lib/listUrlQuery";
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

/**
 * Catalog URL params, product list, and handlers.
 */
export function useCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const searchField = searchParams.get("searchField")?.trim() || "";
  const manufacturer = searchParams.get("manufacturer")?.trim() || "";
  const minQty = searchParams.get("minQty")?.trim() || "";
  const maxQty = searchParams.get("maxQty")?.trim() || "";
  const condition = searchParams.get("condition")?.trim() || "";
  const hasImages = searchParams.get("hasImages")?.trim() || "";
  const page = parsePageFromSearchParams(searchParams);

  const { field: sortField, order: sortOrder, presetValue } =
    effectiveListSort(searchParams, {
      allowedFields: CATALOG_SORT_FIELDS,
      defaultField: "quantity",
      fieldDefaultOrder: FIELD_DEFAULT_ORDER,
    });

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (searchField) params.set("searchField", searchField);
    if (manufacturer) params.set("manufacturer", manufacturer);
    if (minQty) params.set("minQty", minQty);
    if (maxQty) params.set("maxQty", maxQty);
    if (condition) params.set("condition", condition);
    if (hasImages) params.set("hasImages", hasImages);
    params.set("page", String(page));
    params.set("limit", "24");
    params.set("sort", sortField);
    params.set("order", sortOrder);

    api
      .get<ProductsResponse>(`/products?${params}`)
      .then(setProducts)
      // A failed list request must not fall through to the "no matches"
      // empty state: that renders as a soft 404 for crawlers.
      .catch((err: unknown) => {
        console.error(err);
        setProducts(null);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [
    search,
    searchField,
    manufacturer,
    minQty,
    maxQty,
    condition,
    hasImages,
    page,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    if (!products || products.totalPages < 1) return;
    if (page > products.totalPages) {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(products.totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [products, page, searchParams, setSearchParams]);

  const patchParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, val] of Object.entries(patch)) {
        if (val) next.set(key, val);
        else next.delete(key);
      }
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

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

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    for (const key of [
      "searchField",
      "manufacturer",
      "minQty",
      "maxQty",
      "condition",
      "hasImages",
    ]) {
      next.delete(key);
    }
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  };

  /** URL for a catalog page, preserving the active filters and sort. */
  const pageHref = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    return `/catalog?${next}`;
  };

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    search,
    searchField,
    manufacturer,
    minQty,
    maxQty,
    condition,
    hasImages,
    page,
    sortPresetValue: presetValue,
    searchInput,
    setSearchInput,
    filtersOpen,
    setFiltersOpen,
    products,
    loading,
    loadError,
    handleSearch,
    patchParams,
    clearFilters,
    setSortPreset,
    goToPage,
    pageHref,
  };
}
