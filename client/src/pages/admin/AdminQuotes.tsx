import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { QuoteRequest } from "../../lib/types";

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

export default function AdminQuotes() {
  const [data, setData] = useState<QuotesResponse | null>(null);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchQuotes = () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (filterStatus) params.set("status", filterStatus);
    adminApi
      .get<QuotesResponse>(`/quotes?${params}`)
      .then(setData)
      .catch(console.error);
  };

  useEffect(() => {
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus]);

  const handleStatusChange = async (id: string, status: string) => {
    await adminApi.patch(`/quotes/${id}/status`, { status });
    fetchQuotes();
  };

  if (!data) {
    return <div className="text-text-secondary">Loading quotes...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quote Requests</h1>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
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

      {data.quotes.length === 0 ? (
        <p className="text-text-secondary">No quotes found.</p>
      ) : (
        <div className="space-y-2">
          {data.quotes.map((q) => (
            <div
              key={q._id}
              className="bg-bg-card border border-border rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() =>
                  setExpanded(expanded === q._id ? null : q._id)
                }
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
                    handleStatusChange(q._id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs px-3 py-1.5 rounded-full border-0 font-medium ${STATUS_COLORS[q.status] || ""}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {expanded === q._id ? (
                  <ChevronUp size={16} className="text-text-secondary" />
                ) : (
                  <ChevronDown size={16} className="text-text-secondary" />
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
                    <thead>
                      <tr className="text-text-secondary text-xs border-b border-border">
                        <th className="text-left pb-2">Part Number</th>
                        <th className="text-left pb-2">Manufacturer</th>
                        <th className="text-left pb-2">Qty</th>
                        <th className="text-left pb-2">Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/30">
                          <td className="py-1.5 font-medium">
                            {item.partNumber}
                          </td>
                          <td className="py-1.5 text-text-secondary">
                            {item.manufacturer}
                          </td>
                          <td className="py-1.5">
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

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 border border-border rounded hover:border-green-accent disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-text-secondary">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.totalPages}
            className="p-2 border border-border rounded hover:border-green-accent disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
