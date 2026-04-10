import { Search, SlidersHorizontal, ArrowDownUp } from "lucide-react";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import {
  CATALOG_SORT_OPTIONS,
  useCatalog,
} from "../hooks/useCatalog";
import PageSeo from "../components/PageSeo";
import { COMPANY } from "../lib/constants";

const CATALOG_PAGE_SIZE = 24;

export default function Catalog() {
  const {
    manufacturer,
    page,
    sortPresetValue,
    searchInput,
    setSearchInput,
    manufacturers,
    products,
    loading,
    handleSearch,
    setMfg,
    setSortPreset,
    goToPage,
  } = useCatalog();

  const rangeLabel =
    products && products.total > 0
      ? (() => {
          const from = (page - 1) * CATALOG_PAGE_SIZE + 1;
          const to = Math.min(page * CATALOG_PAGE_SIZE, products.total);
          return `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${products.total.toLocaleString()}`;
        })()
      : null;

  return (
    <>
      <PageSeo
        title="Product Catalog"
        description={`Search ${COMPANY.name}'s inventory of electronic components by part number or manufacturer. Request quotes for hard-to-find and military-grade parts.`}
        path="/catalog"
      />
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

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <SlidersHorizontal
                size={16}
                className="text-text-secondary shrink-0"
                aria-hidden
              />
              <label htmlFor="catalog-mfg" className="text-text-secondary text-sm">
                Filter
              </label>
              <select
                id="catalog-mfg"
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
            <div className="flex items-center gap-3">
              <ArrowDownUp
                size={16}
                className="text-text-secondary shrink-0"
                aria-hidden
              />
              <label htmlFor="catalog-sort" className="text-text-secondary text-sm">
                Sort by
              </label>
              <select
                id="catalog-sort"
                value={sortPresetValue}
                onChange={(e) => setSortPreset(e.target.value)}
                className="bg-bg-card border border-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-accent min-w-[12rem]"
              >
                {CATALOG_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className="text-text-secondary text-sm">
            {loading
              ? "…"
              : rangeLabel ?? (products ? "0 results" : "…")}
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

            <div className="mt-10">
              <Pagination page={page} totalPages={products.totalPages} onPageChange={goToPage} />
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-text-secondary">
            <p className="mb-2">No components match your filters.</p>
            <p className="text-sm">
              Try another search, manufacturer, or sort option.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
