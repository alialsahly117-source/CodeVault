const RESEND_API_KEY = process.env.RESEND_API_KEY;
const fromName = process.env.SMTP_FROM_NAME || "CodeVault";
// Resend's own sandbox sender works immediately with no domain setup, but
// can only deliver to the Resend account's own verified address — fine for
// testing, not for real users. Once codevault.vip is verified on Resend,
// set RESEND_FROM_EMAIL to something like "CodeVault <noreply@codevault.vip>".
const fromAddress = process.env.RESEND_FROM_EMAIL || `${fromName} <onboarding@resend.dev>`;

export const emailConfigured = !!RESEND_API_KEY;

// Switched from Gmail SMTP to Resend's HTTPS API: Render's containers
// (at least on the free plan) time out on every outbound SMTP connection
// (port 465/587) — a common anti-spam restriction on cheap/free hosting —
// so nodemailer never had a working path to Gmail regardless of
// credentials. An HTTP API call on port 443 has no such restriction.
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn(`Resend غير مُهيّأ — تعذر إرسال رابط إعادة التعيين إلى ${to}: ${resetUrl}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject: "إعادة تعيين كلمة المرور — CodeVault",
      text: `طلبت إعادة تعيين كلمة المرور لحسابك في CodeVault.\n\nاضغط الرابط التالي خلال ساعة واحدة لتعيين كلمة مرور جديدة:\n${resetUrl}\n\nإذا لم تطلب هذا، تجاهل هذه الرسالة ولن يتغير شيء في حسابك.`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #071426; color: #f4f6fa; border-radius: 12px;">
          <div style="font-family: monospace; font-size: 18px; font-weight: bold; margin-bottom: 16px;">CodeVault</div>
          <h2 style="font-size: 18px; margin: 0 0 12px;">إعادة تعيين كلمة المرور</h2>
          <p style="color: #9aa8bd; line-height: 1.7;">
            طلبت إعادة تعيين كلمة المرور لحسابك. اضغط الزر التالي خلال ساعة واحدة لتعيين كلمة مرور جديدة.
            إذا لم تطلب هذا، تجاهل هذه الرسالة ولن يتغير شيء في حسابك.
          </p>
          <a href="${resetUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2f8fff; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
            تعيين كلمة مرور جديدة
          </a>
          <p style="color: #6b7a90; font-size: 12px; margin-top: 24px; word-break: break-all;">
            أو انسخ هذا الرابط: ${resetUrl}
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
}
