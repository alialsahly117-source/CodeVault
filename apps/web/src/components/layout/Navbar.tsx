import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { authService } from "../../services/auth.service";
import { Button } from "@codevault/ui";
import toast from "react-hot-toast";

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || "http://localhost:3001";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/codes", label: "الأكواد" },
  { to: "/prompts", label: "البرومبتات" },
  { to: "/explore", label: "استكشاف" },
  { to: "/contact", label: "تواصل معنا" },
];

export function Navbar() {
  const { user, isAuthenticated, isStaff, refetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await authService.logout();
    refetch();
    setMenuOpen(false);
    toast.success("تم تسجيل الخروج");
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-text">
            <img src="/icon-192.png" alt="" className="h-14 w-14" />
            CodeVault
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-accent" : "text-text-secondary hover:text-text"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border bg-bg-elevated py-1 pl-3 pr-1 text-sm text-text hover:bg-bg-hover"
              >
                {user?.profile?.displayName}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                  {user?.profile?.displayName?.charAt(0) ?? "U"}
                </span>
              </button>
              {menuOpen && (
                <div
                  onMouseLeave={() => setMenuOpen(false)}
                  className="absolute left-0 mt-2 w-48 rounded-lg border border-border bg-bg-card py-1 shadow-lg"
                >
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text"
                  >
                    الملف الشخصي
                  </Link>
                  {isStaff && (
                    <a
                      href={ADMIN_URL}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text"
                    >
                      لوحة التحكم ↗
                    </a>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-right text-sm text-danger hover:bg-bg-hover"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                تسجيل الدخول
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                إنشاء حساب
              </Button>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md text-text md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="فتح القائمة"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-bg px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-bg-elevated text-accent" : "text-text-secondary"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-text">
                  الملف الشخصي
                </Link>
                {isStaff && (
                  <a href={ADMIN_URL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-text">
                    لوحة التحكم ↗
                  </a>
                )}
                <Button variant="danger" size="sm" onClick={handleLogout}>
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => navigate("/login")}>
                  تسجيل الدخول
                </Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  إنشاء حساب
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
