import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../features/auth/AuthContext";
import { ROLE_LABELS } from "@codevault/config";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  minRole?: "moderator" | "admin";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  { label: "", items: [{ to: "/", label: "لوحة القيادة", end: true }] },
  {
    label: "المحتوى",
    items: [
      { to: "/projects", label: "المشاريع" },
      { to: "/codes", label: "الأكواد" },
      { to: "/prompts", label: "البرومبتات" },
      { to: "/categories", label: "التصنيفات" },
      { to: "/tags", label: "الوسوم" },
    ],
  },
  {
    label: "المستخدمون",
    items: [
      { to: "/users", label: "المستخدمون", minRole: "admin" },
      { to: "/reports", label: "البلاغات", minRole: "moderator" },
    ],
  },
  {
    label: "النظام",
    items: [
      { to: "/settings", label: "الإعدادات", minRole: "admin" },
      { to: "/logs", label: "سجل النشاط", minRole: "admin" },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin, isModerator } = useAuth();

  function canSee(item: NavItem) {
    if (item.minRole === "admin") return isAdmin;
    if (item.minRole === "moderator") return isModerator;
    return true;
  }

  return (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5 text-lg font-extrabold tracking-tight text-text">
        <img src="/icon-192.png" alt="" className="h-10 w-10" />
        CodeVault Admin
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group, i) => {
          const items = group.items.filter(canSee);
          if (items.length === 0) return null;
          return (
          <div key={i} className="mb-5">
            {group.label && (
              <div className="mb-2 px-3 text-[11px] font-semibold tracking-wide text-text-muted">{group.label}</div>
            )}
            <div className="flex flex-col gap-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-accent/10 text-accent" : "text-text-secondary hover:bg-bg-hover hover:text-text"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          );
        })}
      </nav>
    </>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function handleLogout() {
    await logout();
    toast.success("تم تسجيل الخروج");
    navigate("/login");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/codes?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-64 shrink-0 flex-col border-l border-border bg-bg-elevated md:flex">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-64 flex-col border-l border-border bg-bg-elevated">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-bg-card px-4 sm:px-6">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <form onSubmit={handleSearch} className="hidden max-w-sm flex-1 md:block">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث سريع في الأكواد..."
              className="h-9 w-full rounded-lg border border-border bg-bg-elevated px-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent"
            />
          </form>

          <div className="flex-1 md:hidden" />

          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover"
            aria-label="الإشعارات"
            title="لا توجد إشعارات جديدة"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <div className="flex items-center gap-2 border-r border-border pr-3 sm:pl-1">
            <div className="text-right">
              <div className="text-sm font-medium text-text">{user?.profile?.displayName}</div>
              <div className="text-xs text-text-muted">{user ? ROLE_LABELS[user.role] : ""}</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              {user?.profile?.displayName?.charAt(0) ?? "A"}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-bg-hover hover:text-danger"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 5v1a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
