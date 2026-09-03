import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromName = process.env.SMTP_FROM_NAME || "CodeVault";

// Gmail SMTP for now — swap this transport for Resend (or any other
// provider) once a custom domain is attached; nothing outside this file
// needs to change.
const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
        // Render's containers can resolve Gmail's SMTP AAAA (IPv6) record
        // but have no outbound IPv6 route, so the connection just hangs
        // then fails with ENETUNREACH. Force IPv4, which always works.
        family: 4,
      })
    : null;

export const emailConfigured = !!transporter;

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.warn(`SMTP غير مُهيّأ — تعذر إرسال رابط إعادة التعيين إلى ${to}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: `"${fromName}" <${smtpUser}>`,
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
  });
}
