import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, FileText, MessageSquare, AlertCircle } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import type { AdminStats } from "../../lib/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .get<AdminStats>("/stats")
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="text-red-400 flex items-center gap-2">
        <AlertCircle size={18} /> {error}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-text-secondary">Loading dashboard...</div>;
  }

  const cards = [
    {
      label: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      Icon: Package,
      to: "/admin/products",
      color: "text-blue-400",
    },
    {
      label: "New Quotes",
      value: stats.newQuotes,
      Icon: FileText,
      to: "/admin/quotes",
      color: "text-green-accent",
    },
    {
      label: "Total Quotes",
      value: stats.totalQuotes,
      Icon: FileText,
      to: "/admin/quotes",
      color: "text-yellow-400",
    },
    {
      label: "Unread Messages",
      value: stats.unreadMessages,
      Icon: MessageSquare,
      to: "/admin/messages",
      color: "text-red-400",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-bg-card border border-border rounded-xl p-5 hover:border-green-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm">{card.label}</span>
              <card.Icon size={20} className={card.color} />
            </div>
            <div className="text-3xl font-bold">{card.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
