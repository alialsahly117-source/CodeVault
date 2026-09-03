import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div>
            <div className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-text">
              <img src="/icon-192.png" alt="" className="h-10 w-10" />
              CodeVault
            </div>
            <p className="mt-2 max-w-sm text-sm text-text-secondary">
              مكتبة أكواد جاهزة وبرومبتات ذكاء اصطناعي احترافية، منظمة وقابلة للبحث.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-text">المنصة</span>
              <Link to="/codes" className="text-text-secondary hover:text-text">الأكواد</Link>
              <Link to="/prompts" className="text-text-secondary hover:text-text">البرومبتات</Link>
              <Link to="/explore" className="text-text-secondary hover:text-text">استكشاف</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-medium text-text">الحساب</span>
              <Link to="/login" className="text-text-secondary hover:text-text">تسجيل الدخول</Link>
              <Link to="/register" className="text-text-secondary hover:text-text">إنشاء حساب</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-medium text-text">تواصل معنا</span>
              <Link to="/contact" className="text-text-secondary hover:text-text">نموذج التواصل</Link>
              <a href="mailto:alialsahly.ai@gmail.com" dir="ltr" className="text-text-secondary hover:text-text">
                alialsahly.ai@gmail.com
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-xs text-text-muted">
          © {new Date().getFullYear()} CodeVault. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
