import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Label, Button } from "@codevault/ui";
import { Input } from "../components/fields";
import { adminService } from "../services/admin.service";
import { ApiError } from "../lib/api";

export function SettingsPage() {
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: adminService.settings });
  const queryClient = useQueryClient();

  const [siteName, setSiteName] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    if (settings.data) {
      setSiteName(settings.data.siteName);
      setMaintenanceMode(settings.data.maintenanceMode);
      setAllowRegistration(settings.data.allowRegistration);
    }
  }, [settings.data]);

  const saveMutation = useMutation({
    mutationFn: () => adminService.updateSettings({ siteName, maintenanceMode, allowRegistration }),
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حفظ الإعدادات"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">إعدادات النظام</h1>

      <div className="mt-6 max-w-lg rounded-xl border border-border bg-bg-card p-5">
        <div>
          <Label>اسم الموقع</Label>
          <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
        </div>

        <label className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-border bg-bg-elevated p-3">
          <div>
            <div className="text-sm font-medium text-text">وضع الصيانة</div>
            <div className="text-xs text-text-secondary">إخفاء الموقع العام عن الزوار مؤقتًا (يبقى متاحًا لفريق العمل)</div>
          </div>
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>

        <label className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-border bg-bg-elevated p-3">
          <div>
            <div className="text-sm font-medium text-text">السماح بإنشاء حسابات جديدة</div>
            <div className="text-xs text-text-secondary">تعطيله يمنع التسجيل عبر البريد الإلكتروني و Google</div>
          </div>
          <input
            type="checkbox"
            checked={allowRegistration}
            onChange={(e) => setAllowRegistration(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>

        <Button className="mt-5" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}
