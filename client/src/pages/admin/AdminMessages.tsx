import { useState, useEffect, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  MailOpen,
  Trash2,
  Search,
} from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { ContactMessage } from "../../lib/types";
import Pagination from "../../components/Pagination";
import { useAsyncQuery } from "../../hooks/useAsyncQuery";

interface MessagesResponse {
  messages: ContactMessage[];
  total: number;
  page: number;
  totalPages: number;
}

const MSG_PAGE_SIZE = 20;

const MESSAGE_SORT_FIELDS = ["createdAt", "fullName", "isRead"] as const;

const MESSAGE_FIELD_ORDER: Record<string, "asc" | "desc"> = {
  createdAt: "desc",
  fullName: "asc",
  isRead: "asc",
};

const MESSAGE_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "fullName:asc", label: "Name (A–Z)" },
  { value: "fullName:desc", label: "Name (Z–A)" },
  { value: "isRead:asc", label: "Unread first" },
  { value: "isRead:desc", label: "Read first" },
];

function effectiveMessageSort(searchParams: URLSearchParams): {
  field: string;
  order: "asc" | "desc";
  presetValue: string;
} {
  const raw = searchParams.get("sort")?.trim();
  const field =
    raw && (MESSAGE_SORT_FIELDS as readonly string[]).includes(raw)
      ? raw
      : "createdAt";
  const o = searchParams.get("order")?.toLowerCase();
  const order: "asc" | "desc" =
    o === "asc" || o === "desc" ? o : MESSAGE_FIELD_ORDER[field] ?? "desc";
  return { field, order, presetValue: `${field}:${order}` };
}

export default function AdminMessages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";
  const readFilter = searchParams.get("isRead") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page =
    Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
  const { field: sortField, order: sortOrder, presetValue } =
    effectiveMessageSort(searchParams);

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

  const setReadFilter = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val === "true" || val === "false") next.set("isRead", val);
    else next.delete("isRead");
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
      params.set("limit", String(MSG_PAGE_SIZE));
      if (searchFromUrl) params.set("search", searchFromUrl);
      if (readFilter === "true" || readFilter === "false") {
        params.set("isRead", readFilter);
      }
      params.set("sort", sortField);
      params.set("order", sortOrder);
      return adminApi.get<MessagesResponse>(`/messages?${params}`);
    },
    [page, searchFromUrl, readFilter, sortField, sortOrder],
  );

  useEffect(() => {
    if (!data || data.totalPages < 1) return;
    if (page > data.totalPages) {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(data.totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [data, page, searchParams, setSearchParams]);

  const handleMarkRead = async (id: string) => {
    setMutationError("");
    try {
      await adminApi.patch(`/messages/${id}/read`, {});
      await refetch();
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : "Failed to mark as read",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    setMutationError("");
    try {
      await adminApi.delete(`/messages/${id}`);
      await refetch();
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : "Failed to delete message",
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
    readFilter !== "" ||
    sortField !== "createdAt" ||
    sortOrder !== "desc";

  if (loading && !data) {
    return <div className="text-text-secondary">Loading messages...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Contact Messages</h1>

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
            placeholder="Search name, email, company, message…"
            className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-white focus:outline-none focus:border-green-accent"
            aria-label="Search messages"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="msg-read" className="text-xs text-text-secondary">
            Read status
          </label>
          <select
            id="msg-read"
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent"
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="msg-sort" className="text-xs text-text-secondary">
            Sort by
          </label>
          <select
            id="msg-sort"
            value={presetValue}
            onChange={(e) => setSortPreset(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-accent min-w-[10rem]"
          >
            {MESSAGE_SORT_OPTIONS.map((o) => (
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
            const from = (page - 1) * MSG_PAGE_SIZE + 1;
            const to = Math.min(page * MSG_PAGE_SIZE, data.total);
            return `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${data.total.toLocaleString()}`;
          })()}
        </p>
      )}

      {data && data.messages.length === 0 ? (
        <p className="text-text-secondary">
          No messages match your filters.{" "}
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
          {data.messages.map((msg) => (
            <div
              key={msg._id}
              className={`bg-bg-card border rounded-lg overflow-hidden ${
                msg.isRead ? "border-border/50" : "border-green-accent/40"
              }`}
            >
              <div
                role="button"
                tabIndex={0}
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => toggleExpanded(msg._id)}
                onKeyDown={(e) => onRowKeyDown(e, msg._id)}
                aria-expanded={expanded === msg._id}
              >
                {msg.isRead ? (
                  <MailOpen size={16} className="text-text-secondary shrink-0" aria-hidden />
                ) : (
                  <Mail size={16} className="text-green-accent shrink-0" aria-hidden />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{msg.fullName}</span>
                    {msg.company && (
                      <span className="text-text-secondary text-xs">
                        ({msg.company})
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary text-xs truncate">
                    {msg.message}
                  </p>
                </div>
                <span className="text-text-secondary text-xs shrink-0">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2 shrink-0">
                  {!msg.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleMarkRead(msg._id);
                      }}
                      className="text-text-secondary hover:text-green-accent text-xs"
                      aria-label={`Mark message from ${msg.fullName} as read`}
                    >
                      <MailOpen size={14} aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(msg._id);
                    }}
                    className="text-text-secondary hover:text-red-400"
                    aria-label={`Delete message from ${msg.fullName}`}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </div>

              {expanded === msg._id && (
                <div className="border-t border-border px-4 py-3 text-sm space-y-2 bg-bg-primary/50">
                  <p>
                    <span className="text-text-secondary">Email:</span>{" "}
                    {msg.email}
                  </p>
                  {msg.phone && (
                    <p>
                      <span className="text-text-secondary">Phone:</span>{" "}
                      {msg.phone}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.messages.length > 0 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
