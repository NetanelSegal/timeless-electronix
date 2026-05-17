import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  FileText,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { clearToken } from "../../lib/adminApi";

const LINKS = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/messages", label: "Messages", Icon: MessageSquare },
  { to: "/admin/quotes", label: "Quotes", Icon: FileText },
];

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
};

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  onLogout,
}: Props) {
  const location = useLocation();
  const navId = "admin-sidebar-nav";

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } bg-bg-secondary border-r border-border flex flex-col shrink-0 transition-[width] duration-200 ease-out`}
    >
      <div className="p-3 border-b border-border flex items-start gap-2">
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <Link to="/" className="text-sm font-bold block truncate">
              Timeless Electronix
            </Link>
            <p className="text-text-secondary text-xs mt-0.5">Admin Panel</p>
          </div>
        ) : (
          <span className="sr-only">Timeless Electronix Admin</span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="shrink-0 p-2 rounded-lg text-text-secondary hover:text-white hover:bg-bg-card border border-transparent hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent"
          aria-expanded={!collapsed}
          aria-controls={navId}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft size={18} aria-hidden />
          ) : (
            <PanelLeftClose size={18} aria-hidden />
          )}
        </button>
      </div>

      <nav id={navId} className="flex-1 py-4 space-y-1 px-2">
        {LINKS.map((link) => {
          const active =
            link.to === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-green-brand/20 text-green-accent font-medium"
                  : "text-text-secondary hover:text-white hover:bg-bg-card"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <link.Icon size={18} className="shrink-0" aria-hidden />
              {collapsed ? (
                <span className="sr-only">{link.label}</span>
              ) : (
                link.label
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={() => {
            clearToken();
            onLogout();
          }}
          title="Logout"
          className={`flex items-center gap-2 text-text-secondary hover:text-red-400 text-sm w-full px-3 py-2 rounded-lg hover:bg-bg-card ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={16} aria-hidden />
          {collapsed ? <span className="sr-only">Logout</span> : "Logout"}
        </button>
      </div>
    </aside>
  );
}
