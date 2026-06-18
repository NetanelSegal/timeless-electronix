import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { CATALOG_SEARCH_FIELD_OPTIONS } from "../lib/catalogSearchFields";
import { PRODUCT_CONDITIONS } from "../lib/productCondition";

type Props = {
  searchField: string;
  manufacturer: string;
  minQty: string;
  maxQty: string;
  condition: string;
  hasImages: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatch: (patch: Record<string, string | undefined>) => void;
};

export default function CatalogFilters({
  searchField,
  manufacturer,
  minQty,
  maxQty,
  condition,
  hasImages,
  open,
  onOpenChange,
  onPatch,
}: Props) {
  const [mfg, setMfg] = useState(manufacturer);
  const [minQ, setMinQ] = useState(minQty);
  const [maxQ, setMaxQ] = useState(maxQty);

  useEffect(() => {
    setMfg(manufacturer);
  }, [manufacturer]);
  useEffect(() => {
    setMinQ(minQty);
  }, [minQty]);
  useEffect(() => {
    setMaxQ(maxQty);
  }, [maxQty]);

  useEffect(() => {
    const t = setTimeout(() => {
      onPatch({
        manufacturer: mfg.trim() || undefined,
        minQty: minQ.trim() || undefined,
        maxQty: maxQ.trim() || undefined,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [mfg, minQ, maxQ, onPatch]);

  const activeCount = [
    searchField,
    manufacturer,
    minQty,
    maxQty,
    condition,
    hasImages === "true" ? "1" : "",
  ].filter(Boolean).length;

  return (
    <div className="border border-border rounded-lg bg-bg-card/40 overflow-hidden">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-text-secondary hover:text-white hover:bg-bg-card/80 transition-colors"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <Filter size={16} aria-hidden />
          Filters
          {activeCount > 0 ? (
            <span className="bg-green-brand/20 text-green-accent text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          ) : null}
        </span>
        <span className="text-xs text-text-secondary/80">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 border-t border-border/60">
          <div>
            <label
              htmlFor="catalog-search-scope"
              className="text-xs text-text-secondary block mb-1"
            >
              Search scope
            </label>
            <select
              id="catalog-search-scope"
              value={searchField}
              onChange={(e) =>
                onPatch({ searchField: e.target.value || undefined })
              }
              className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
            >
              {CATALOG_SEARCH_FIELD_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">
              Manufacturer (exact)
            </label>
            <input
              value={mfg}
              onChange={(e) => setMfg(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
              placeholder="e.g. Murata"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">
              Min quantity
            </label>
            <input
              type="number"
              min={0}
              value={minQ}
              onChange={(e) => setMinQ(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">
              Max quantity
            </label>
            <input
              type="number"
              min={0}
              value={maxQ}
              onChange={(e) => setMaxQ(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
            />
          </div>
          <div>
            <label
              htmlFor="catalog-condition"
              className="text-xs text-text-secondary block mb-1"
            >
              Condition
            </label>
            <select
              id="catalog-condition"
              value={condition}
              onChange={(e) =>
                onPatch({ condition: e.target.value || undefined })
              }
              className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
            >
              <option value="">Any condition</option>
              {PRODUCT_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-secondary">Options</span>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={hasImages === "true"}
                onChange={(e) =>
                  onPatch({
                    hasImages: e.target.checked ? "true" : undefined,
                  })
                }
                className="rounded border-border"
              />
              Has images
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
