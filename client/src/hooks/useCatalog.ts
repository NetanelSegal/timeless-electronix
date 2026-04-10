import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { ProductsResponse } from "../lib/types";

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

    api
      .get<ProductsResponse>(`/products?${params}`)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, manufacturer, page]);

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
    searchInput,
    setSearchInput,
    manufacturers,
    products,
    loading,
    handleSearch,
    setMfg,
    goToPage,
  };
}
