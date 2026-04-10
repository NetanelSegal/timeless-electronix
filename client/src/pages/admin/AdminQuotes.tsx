import { useState, useEffect, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { QuoteRequest } from "../../lib/types";
import Pagination from "../../components/Pagination";
import { useAsyncQuery } from "../../hooks/useAsyncQuery";

interface QuotesResponse {
  quotes: QuoteRequest[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-green-brand/20 text-green-accent",
  "in-progress": "bg-yellow-900/30 text-yellow-400",
  completed: "bg-blue-900/30 text-blue-400",
  cancelled: "bg-red-900/30 text-red-400",
};

const STATUSES = ["new", "in-progress", "completed", "cancelled"] as const;

const QUOTE_PAGE_SIZE = 20;

const QUOTE_SORT_FIELDS = [
  "createdAt",
  "status",
  "customerName",
  "customerEmail",
] as const;

const QUOTE_FIELD_ORDER: Record<string, "asc" | "desc"> = {
  createdAt: "desc",
  status: "asc",
  customerName: "asc",
  customerEmail: "asc",
};

const QUOTE_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "status:asc", label: "Status (A–Z)" },
  { value: "status:desc", label: "Status (Z–A)" },
  { value: "customerName:asc", label: "Customer name (A–Z)" },
  { value: "customerName:desc", label: "Customer name (Z–A)" },
  { value: "customerEmail:asc", label: "Email (A–Z)" },
  { value: "customerEmail:desc", label: "Email (Z–A)" },
];

function effectiveQuoteSort(searchParams: URLSearchParams): {
  field: string;
  order: "asc" | "desc";
  presetValue: string;
} {
  const raw = searchParams.get("sort")?.trim();
  const field =
    raw && (QUOTE_SORT_FIELDS as readonly string[]).includes(raw)
      ? raw
      : "createdAt";
  const o = searchParams.get("order")?.toLowerCase();
  const order: "asc" | "desc" =
    o === "asc" || o === "desc" ? o : QUOTE_FIELD_ORDER[field] ?? "desc";
  return { field, order, presetValue: `${field}:${order}` };
}

export default function AdminQuotes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";
  const filterStatus = searchParams.get("status") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page =
    Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
  const { field: sortField, order: sortOrder, presetValue } =
    effectiveQuoteSort(searchParams);

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState("");

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      if (q === searchFromUrl) return;
      const next = new URLSearchParams(searchParams);
      if (q) next.set("search", q);
      else next.delete("search");
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, searchFromUrl, searchParams, setSearchParams]);

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };

  const setStatus = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set("status", val);
    else next.delete("status");
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
    if (field === "createdAt" && ord === "desc") {
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
    setSearchParams(new URLSearchParams({ page: "1" }));
    setSearchInput("");
  };

  const { data, error, loading, refetch } = useAsyncQuery(
    () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(QUOTE_PAGE_SIZE));
      if (searchFromUrl) params.set("search", searchFromUrl);
      if (filterStatus) params.set("status", filterStatus);
      params.set("sort", sortField);
      params.set("order", sortOrder);
      return adminApi.get<QuotesResponse>(`/quotes?${params}`);
    },
    [page, searchFromUrl, filterStatus, sortField, sortOrder],
  );

  useEffect(() => {
    if (!data || data.totalPages < 1) return;
    if (page > data.totalPages) {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(data.totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [data, page, searchParams, setSearchParams]);

  const handleStatusChange = async (id: string, status: string) => {
    setMutationError("");
    try {
      await adminApi.patch(`/quotes/${id}/status`, { status });
      await refetch();
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : "Failed to update status",
      );
    }
  };

  const flushSearch = () => {
    const next = new URLSearchParams(searchParams);
    const q = searchInput.trim();
    if (q) next.set("search", q);
    else next.delete("search");
    next.set("page", "1");
    setSearchParams(next);
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const onRowKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpanded(id);
    }
  };

  const hasActiveFilters =
    !!searchFromUrl ||
    !!filterStatus ||
    sortField !== "createdAt" ||
    sortOrder !== "desc";

  if (loading && !data) {
    return <div className="text-text-secondary">Loading quotes...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Quote Requests</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") flushSearch();
            }}
            placeholder="Search name, email, company, note…"
            className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-white focus:outline-none focus:border-green-accent"
            aria-label="Search quotes"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="quote-status" className="text-xs text-text-secondary">
            Status
          </label>
          <select
            id="quote-status"
            value={filterStatus}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="quote-sort" className="text-xs text-text-secondary">
            Sort by
          </label>
          <select
            id="quote-sort"
            value={presetValue}
            onChange={(e) => setSortPreset(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent min-w-[11rem]"
          >
            {QUOTE_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-text-secondary hover:text-white border border-border px-3 py-2 rounded-lg hover:border-green-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      {(error || mutationError) && (
        <p className="text-red-400 text-sm mb-4">{mutationError || error}</p>
      )}

      {data && data.total > 0 && (
        <p className="text-text-secondary text-sm mb-3">
          {(() => {
            const from = (page - 1) * QUOTE_PAGE_SIZE + 1;
            const to = Math.min(page * QUOTE_PAGE_SIZE, data.total);
            return `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${data.total.toLocaleString()}`;
          })()}
        </p>
      )}

      {data && data.quotes.length === 0 ? (
        <p className="text-text-secondary">
          No quotes match your filters.{" "}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-green-accent hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </p>
      ) : data && (
        <div className="space-y-2">
          {data.quotes.map((q) => (
            <div
              key={q._id}
              className="bg-bg-card border border-border rounded-lg overflow-hidden"
            >
              <div
                role="button"
                tabIndex={0}
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => toggleExpanded(q._id)}
                onKeyDown={(e) => onRowKeyDown(e, q._id)}
                aria-expanded={expanded === q._id}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {q.customerName}
                    </span>
                    <span className="text-text-secondary text-xs">
                      ({q.customerEmail})
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs">
                    {q.items.length} item{q.items.length !== 1 ? "s" : ""}{" "}
                    &middot;{" "}
                    {new Date(q.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <select
                  value={q.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    void handleStatusChange(q._id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs px-3 py-1.5 rounded-full border-0 font-medium ${STATUS_COLORS[q.status] || ""}`}
                  aria-label={`Status for ${q.customerName}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {expanded === q._id ? (
                  <ChevronUp size={16} className="text-text-secondary shrink-0" aria-hidden />
                ) : (
                  <ChevronDown size={16} className="text-text-secondary shrink-0" aria-hidden />
                )}
              </div>

              {expanded === q._id && (
                <div className="border-t border-border px-4 py-3 bg-bg-primary/50">
                  {q.customerCompany && (
                    <p className="text-sm mb-2">
                      <span className="text-text-secondary">Company:</span>{" "}
                      {q.customerCompany}
                    </p>
                  )}
                  {q.customerPhone && (
                    <p className="text-sm mb-2">
                      <span className="text-text-secondary">Phone:</span>{" "}
                      {q.customerPhone}
                    </p>
                  )}
                  {q.message && (
                    <p className="text-sm mb-3">
                      <span className="text-text-secondary">Note:</span>{" "}
                      {q.message}
                    </p>
                  )}
                  <table className="w-full text-sm mt-2">
                    <caption className="sr-only">
                      Line items for this quote request
                    </caption>
                    <thead>
                      <tr className="text-text-secondary text-xs border-b border-border">
                        <th scope="col" className="text-left pb-2 pr-2">
                          Part Number
                        </th>
                        <th scope="col" className="text-left pb-2 pr-2">
                          Manufacturer
                        </th>
                        <th scope="col" className="text-left pb-2 pr-2">
                          Qty
                        </th>
                        <th scope="col" className="text-left pb-2">
                          Ref
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/30">
                          <td className="py-1.5 font-medium pr-2">
                            {item.partNumber}
                          </td>
                          <td className="py-1.5 text-text-secondary pr-2">
                            {item.manufacturer}
                          </td>
                          <td className="py-1.5 pr-2">
                            {item.quantity.toLocaleString()}
                          </td>
                          <td className="py-1.5 text-text-secondary">
                            {item.ourReference}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.quotes.length > 0 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
