import { useState, useEffect } from "react";
import {
  Mail,
  MailOpen,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { ContactMessage } from "../../lib/types";

interface MessagesResponse {
  messages: ContactMessage[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminMessages() {
  const [data, setData] = useState<MessagesResponse | null>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchMessages = () => {
    adminApi
      .get<MessagesResponse>(`/messages?page=${page}&limit=20`)
      .then(setData)
      .catch(console.error);
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleMarkRead = async (id: string) => {
    await adminApi.patch(`/messages/${id}/read`, {});
    fetchMessages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await adminApi.delete(`/messages/${id}`);
    fetchMessages();
  };

  if (!data) {
    return <div className="text-text-secondary">Loading messages...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Contact Messages</h1>

      {data.messages.length === 0 ? (
        <p className="text-text-secondary">No messages yet.</p>
      ) : (
        <div className="space-y-2">
          {data.messages.map((msg) => (
            <div
              key={msg._id}
              className={`bg-bg-card border rounded-lg overflow-hidden ${
                msg.isRead ? "border-border/50" : "border-green-accent/40"
              }`}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() =>
                  setExpanded(expanded === msg._id ? null : msg._id)
                }
              >
                {msg.isRead ? (
                  <MailOpen size={16} className="text-text-secondary shrink-0" />
                ) : (
                  <Mail size={16} className="text-green-accent shrink-0" />
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(msg._id);
                      }}
                      className="text-text-secondary hover:text-green-accent text-xs"
                      title="Mark read"
                    >
                      <MailOpen size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(msg._id);
                    }}
                    className="text-text-secondary hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
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
