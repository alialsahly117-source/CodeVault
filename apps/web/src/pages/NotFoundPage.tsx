import { Link } from "react-router-dom";
import { Button } from "@codevault/ui";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="font-mono text-5xl font-bold text-accent">404</div>
      <h1 className="mt-3 text-xl font-bold text-text">الصفحة غير موجودة</h1>
      <p className="mt-2 text-sm text-text-secondary">الرابط الذي وصلت إليه غير موجود أو تم نقله.</p>
      <Link to="/" className="mt-6">
        <Button>العودة إلى الرئيسية</Button>
      </Link>
    </div>
  );
}
