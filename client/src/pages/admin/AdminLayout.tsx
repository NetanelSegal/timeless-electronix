import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { isAuthenticated } from "../../lib/adminApi";
import { useAdminSidebarCollapsed } from "../../hooks/admin/useAdminSidebarCollapsed";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { collapsed, toggle } = useAdminSidebarCollapsed();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={toggle}
        onLogout={() => navigate("/admin/login")}
      />
      <main className="flex-1 overflow-auto p-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
