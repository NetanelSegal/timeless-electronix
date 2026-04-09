import { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  FileText,
  LogOut,
} from "lucide-react";
import { isAuthenticated, clearToken } from "../../lib/adminApi";

const LINKS = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/messages", label: "Messages", Icon: MessageSquare },
  { to: "/admin/quotes", label: "Quotes", Icon: FileText },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    clearToken();
    navigate("/admin/login");
  };

  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Link to="/" className="text-sm font-bold">
            Timeless Electronix
          </Link>
          <p className="text-text-secondary text-xs mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {LINKS.map((link) => {
            const active =
              link.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-green-brand/20 text-green-accent font-medium"
                    : "text-text-secondary hover:text-white hover:bg-bg-card"
                }`}
              >
                <link.Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-text-secondary hover:text-red-400 text-sm w-full px-3 py-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
