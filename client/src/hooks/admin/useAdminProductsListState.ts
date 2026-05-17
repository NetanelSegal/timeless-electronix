import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { effectiveListSort, parsePageFromSearchParams } from "../../lib/listUrlQuery";
import { useDebouncedSearchToUrl } from "../useDebouncedSearchToUrl";

export const ADMIN_PAGE_SIZE = 50;

export const ADMIN_PRODUCT_SORT_FIELDS = [
  "updatedAt",
  "partNumber",
  "seoSlug",
  "manufacturer",
  "quantity",
  "ourReference",
] as const;

export const ADMIN_PRODUCT_FIELD_ORDER: Record<string, "asc" | "desc"> = {
  updatedAt: "desc",
  partNumber: "asc",
  seoSlug: "asc",
  manufacturer: "asc",
  quantity: "desc",
  ourReference: "asc",
};

export type AdminProductsListQuery = {
  search: string;
  searchField: string;
  manufacturer: string;
  minQty: string;
  maxQty: string;
  isSample: string;
  hasImages: string;
  missingSlug: string;
  page: number;
  sortField: string;
  sortOrder: "asc" | "desc";
};

/** Allowed `searchField` values for GET /admin/products (server allowlist). */
export const ADMIN_SEARCH_FIELD_OPTIONS = [
  { value: "", label: "All fields" },
  { value: "partNumber", label: "Part number" },
  { value: "seoSlug", label: "SEO slug" },
  { value: "productSummary", label: "Summary" },
  { value: "description", label: "Description" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "ourReference", label: "Reference" },
] as const;

export function useAdminProductsListState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";
  const page = parsePageFromSearchParams(searchParams);
  const { field: sortField, order: sortOrder } = effectiveListSort(
    searchParams,
    {
      allowedFields: ADMIN_PRODUCT_SORT_FIELDS,
      defaultField: "updatedAt",
      fieldDefaultOrder: ADMIN_PRODUCT_FIELD_ORDER,
    },
  );

  const searchField = searchParams.get("searchField")?.trim() || "";
  const manufacturer = searchParams.get("manufacturer")?.trim() || "";
  const minQty = searchParams.get("minQty")?.trim() || "";
  const maxQty = searchParams.get("maxQty")?.trim() || "";
  const isSample = searchParams.get("isSample")?.trim() || "";
  const hasImages = searchParams.get("hasImages")?.trim() || "";
  const missingSlug = searchParams.get("missingSlug")?.trim() || "";

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useDebouncedSearchToUrl({
    searchInput,
    urlSearch: searchFromUrl,
    searchParams,
    setSearchParams,
  });

  const listQuery = useMemo<AdminProductsListQuery>(
    () => ({
      search: searchFromUrl,
      searchField,
      manufacturer,
      minQty,
      maxQty,
      isSample,
      hasImages,
      missingSlug,
      page,
      sortField,
      sortOrder,
    }),
    [
      searchFromUrl,
      searchField,
      manufacturer,
      minQty,
      maxQty,
      isSample,
      hasImages,
      missingSlug,
      page,
      sortField,
      sortOrder,
    ],
  );

  const setPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(p));
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const setSortColumn = useCallback(
    (field: string) => {
      const next = new URLSearchParams(searchParams);
      if (sortField === field) {
        next.set("order", sortOrder === "asc" ? "desc" : "asc");
      } else {
        next.set("sort", field);
        next.set("order", ADMIN_PRODUCT_FIELD_ORDER[field] ?? "desc");
      }
      next.set("page", "1");
      setSearchParams(next);
    },
    [searchParams, setSearchParams, sortField, sortOrder],
  );

  const patchParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams);
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    next.set("page", "1");
    setSearchParams(next);
    setSearchInput("");
  }, [setSearchParams]);

  const flushSearchToUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    const q = searchInput.trim();
    if (q) next.set("search", q);
    else next.delete("search");
    next.set("page", "1");
    setSearchParams(next);
  }, [searchInput, searchParams, setSearchParams]);

  useEffect(() => {
    if (!searchParams.toString()) return;
    const pageStr = searchParams.get("page");
    const pageNum = parseInt(pageStr || "1", 10);
    if (!Number.isFinite(pageNum) || pageNum < 1) {
      const next = new URLSearchParams(searchParams);
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return {
    searchParams,
    searchFromUrl,
    searchInput,
    setSearchInput,
    page,
    sortField,
    sortOrder,
    listQuery,
    searchField,
    manufacturer,
    minQty,
    maxQty,
    isSample,
    hasImages,
    missingSlug,
    setPage,
    setSortColumn,
    patchParams,
    clearFilters,
    flushSearchToUrl,
    filtersOpen,
    setFiltersOpen,
  };
}
