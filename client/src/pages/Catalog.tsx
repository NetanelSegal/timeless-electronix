import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { api } from "../lib/api";
import type { ProductsResponse } from "../lib/types";
import ProductCard from "../components/ProductCard";

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const manufacturer = searchParams.get("manufacturer") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(search);

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

  return (
    <>
      {/* Header */}
      <section className="bg-bg-secondary border-b border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Product Catalog
          </h1>
          <p className="text-text-secondary">
            Search our inventory of{" "}
            <span className="text-white font-semibold">
              {products?.total?.toLocaleString() ?? "..."}
            </span>{" "}
            available components
          </p>

          <form
            onSubmit={handleSearch}
            className="flex max-w-2xl gap-3 mt-6"
          >
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search Part Number or Manufacturer..."
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-bg-card border border-border text-white placeholder:text-gray-500 focus:outline-none focus:border-green-accent"
              />
            </div>
            <button
              type="submit"
              className="bg-green-brand hover:bg-green-accent text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={16} className="text-text-secondary" />
            <span className="text-text-secondary text-sm">Filter:</span>
            <select
              value={manufacturer}
              onChange={(e) => setMfg(e.target.value)}
              className="bg-bg-card border border-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-accent"
            >
              <option value="">All Manufacturers</option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <span className="text-text-secondary text-sm">
            {products ? `${products.total.toLocaleString()} results` : "..."}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-secondary">
            Loading components...
          </div>
        ) : products && products.products.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {products.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-border hover:border-green-accent disabled:opacity-30 disabled:cursor-default transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-text-secondary">
                  Page{" "}
                  <span className="text-white font-semibold">{page}</span> of{" "}
                  {products.totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= products.totalPages}
                  className="p-2 rounded-lg border border-border hover:border-green-accent disabled:opacity-30 disabled:cursor-default transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-text-secondary">
            No components found. Try a different search.
          </div>
        )}
      </section>
    </>
  );
}
