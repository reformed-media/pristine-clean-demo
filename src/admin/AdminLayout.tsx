import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAdmin } from "@/lib/admin-context";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { to: "/admin/today", label: "Today" },
  { to: "/admin/calendar", label: "Calendar" },
  { to: "/admin/clients", label: "Clients" },
  { to: "/admin/leads", label: "Leads" },
];

export function AdminLayout() {
  const { adminUser } = useAdmin();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/admin/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-[240px] shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <div className="text-sm font-bold tracking-tight text-foreground">
            Pristine Clean
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 tracking-widest uppercase">
            Admin
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-sm text-sm transition-colors ${
                  isActive
                    ? "bg-primary/15 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-1">
          <div className="px-3 py-1">
            <div className="text-sm text-foreground font-medium">
              {adminUser?.first_name} {adminUser?.last_name}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {adminUser?.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-sm transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
