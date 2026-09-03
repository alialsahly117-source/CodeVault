import { useState, type ReactNode } from "react";
import { Button } from "./Button";

export function FilterBar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden flex-wrap items-center gap-3 md:flex">{children}</div>

      <div className="md:hidden">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          الفلاتر
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-full rounded-t-2xl border-t border-border bg-bg-card p-4 max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text">الفلاتر</h3>
              <button onClick={() => setOpen(false)} className="text-text-secondary">
                إغلاق
              </button>
            </div>
            <div className="flex flex-col gap-3">{children}</div>
            <Button className="mt-4 w-full" onClick={() => setOpen(false)}>
              تطبيق
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
