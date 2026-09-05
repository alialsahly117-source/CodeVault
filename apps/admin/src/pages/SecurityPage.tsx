import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Label, Button } from "@codevault/ui";
import { Input } from "../components/fields";
import { authService } from "../services/auth.service";
import { useAuth } from "../features/auth/AuthContext";
import { ApiError } from "../lib/api";

type SetupStep = "idle" | "scanning" | "backupCodes";

export function SecurityPage() {
  const { user, isAuthenticated, refetch } = useAuth();
  const [step, setStep] = useState<SetupStep>("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [disablePassword, setDisablePassword] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);

  const setupMutation = useMutation({
    mutationFn: authService.twoFactorSetup,
    onSuccess: (data) => {
      setSecret(data.secret);
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setStep("scanning");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر بدء الإعداد"),
  });

  const enableMutation = useMutation({
    mutationFn: () => authService.twoFactorEnable(secret, confirmCode),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setStep("backupCodes");
      setConfirmCode("");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "الرمز غير صحيح"),
  });

  const disableMutation = useMutation({
    mutationFn: () => authService.twoFactorDisable(disablePassword || undefined, disableToken),
    onSuccess: () => {
      toast.success("تم إيقاف المصادقة الثنائية");
      setShowDisableForm(false);
      setDisablePassword("");
      setDisableToken("");
      refetch();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر إيقاف المصادقة الثنائية"),
  });

  function finishSetup() {
    setStep("idle");
    setSecret("");
    setQrCodeDataUrl("");
    setBackupCodes([]);
    refetch();
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">الأمان</h1>
      <p className="mt-1 text-sm text-text-secondary">إدارة المصادقة الثنائية لحسابك الشخصي.</p>

      <div className="mt-6 max-w-lg rounded-xl border border-border bg-bg-card p-5">
        {step === "idle" && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-text">المصادقة الثنائية (2FA)</div>
                <div className="mt-1 text-xs text-text-secondary">
                  {user?.twoFactorEnabled
                    ? "مفعّلة — يلزم رمز من تطبيق المصادقة عند كل تسجيل دخول."
                    : "غير مفعّلة — يُنصح بشدة بتفعيلها لحماية حسابك."}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  user?.twoFactorEnabled ? "bg-success/10 text-success" : "bg-bg-elevated text-text-muted"
                }`}
              >
                {user?.twoFactorEnabled ? "مفعّلة" : "غير مفعّلة"}
              </span>
            </div>

            <div className="mt-5">
              {!user?.twoFactorEnabled ? (
                <Button disabled={setupMutation.isPending} onClick={() => setupMutation.mutate()}>
                  تفعيل المصادقة الثنائية
                </Button>
              ) : !showDisableForm ? (
                <Button variant="danger" onClick={() => setShowDisableForm(true)}>
                  إيقاف المصادقة الثنائية
                </Button>
              ) : (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-elevated p-4">
                  <div className="text-sm text-text-secondary">
                    لإيقاف المصادقة الثنائية، أدخل كلمة المرور ورمزًا حاليًا من تطبيق المصادقة (أو رمز استرجاع).
                  </div>
                  {user?.hasPassword && (
                    <div>
                      <Label>كلمة المرور</Label>
                      <Input
                        type="password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <Label>الرمز</Label>
                    <Input value={disableToken} onChange={(e) => setDisableToken(e.target.value)} placeholder="123456" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      disabled={disableMutation.isPending}
                      onClick={() => disableMutation.mutate()}
                    >
                      تأكيد الإيقاف
                    </Button>
                    <Button variant="ghost" onClick={() => setShowDisableForm(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {step === "scanning" && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm font-medium text-text">امسح رمز QR</div>
              <div className="mt-1 text-xs text-text-secondary">
                افتح تطبيق المصادقة (Google Authenticator أو مشابه) وامسح الرمز، أو أدخل المفتاح يدويًا.
              </div>
            </div>

            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="QR code" className="h-48 w-48 self-center rounded-lg bg-white p-2" />
            )}

            <div className="rounded-lg border border-border bg-bg-elevated p-3 text-center font-mono text-sm tracking-wider text-text">
              {secret}
            </div>

            <div>
              <Label>أدخل الرمز من التطبيق للتأكيد</Label>
              <Input
                autoFocus
                inputMode="numeric"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="123456"
              />
            </div>

            <div className="flex gap-2">
              <Button disabled={enableMutation.isPending} onClick={() => enableMutation.mutate()}>
                تأكيد وتفعيل
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("idle");
                  setSecret("");
                  setQrCodeDataUrl("");
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {step === "backupCodes" && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm font-medium text-success">تم تفعيل المصادقة الثنائية بنجاح</div>
              <div className="mt-1 text-xs text-text-secondary">
                احفظ رموز الاسترجاع التالية في مكان آمن — كل رمز يُستخدم مرة واحدة فقط، ولن تظهر مجددًا. استخدمها إذا
                فقدت الوصول إلى تطبيق المصادقة.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg-elevated p-4 font-mono text-sm text-text">
              {backupCodes.map((code) => (
                <div key={code}>{code}</div>
              ))}
            </div>

            <Button onClick={finishSetup}>لقد حفظت الرموز</Button>
          </div>
        )}
      </div>
    </div>
  );
}
