import { Resend } from "resend";

const senderDomainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function renderWelcomeEmail(appOrigin: string) {
  const origin = new URL(appOrigin);
  if (origin.protocol !== "https:" && origin.protocol !== "http:") {
    throw new Error("The welcome email requires an HTTP app origin.");
  }

  const dashboardUrl = escapeHtml(new URL("/dashboard", origin).toString());
  const text = [
    "Welcome to PharmaLens",
    "Your email is verified and your account is ready.",
    "Review saved scans and track reports from your dashboard:",
    new URL("/dashboard", origin).toString(),
    "",
    "PharmaLens provides preliminary visual screening and is not a substitute for professional or regulatory guidance.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;background:#f2f7f6;color:#18312f;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f7f6;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dce9e6;border-radius:16px;overflow:hidden;">
          <tr><td style="background:#063f3c;padding:24px 32px;color:#ffffff;">
            <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.4px;">Pharma<span style="color:#8ce0c7;">Lens</span></p>
          </td></tr>
          <tr><td style="padding:36px 32px 24px;">
            <p style="margin:0 0 12px;color:#087b69;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Your account is ready</p>
            <h1 style="margin:0 0 16px;color:#123d39;font-size:30px;line-height:1.2;">Welcome to PharmaLens</h1>
            <p style="margin:0 0 24px;color:#4b625f;font-size:16px;line-height:1.65;">Your email is verified. You can now securely review saved scans and keep track of reports from your dashboard.</p>
            <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:8px;background:#087b69;">
              <a href="${dashboardUrl}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">Open your dashboard</a>
            </td></tr></table>
            <p style="margin:28px 0 0;color:#607572;font-size:13px;line-height:1.6;">PharmaLens offers preliminary visual screening only. It is not a substitute for professional advice or official regulatory verification.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #e7efed;padding:18px 32px;color:#758986;font-size:12px;line-height:1.5;">You received this message because an account was created with your email address.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { html, text };
}

type SendWelcomeEmailInput = {
  userId: string;
  email: string;
  appOrigin: string;
};

export async function sendWelcomeEmail({ userId, email, appOrigin }: SendWelcomeEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const domain = process.env.RESEND_EMAIL_DOMAIN?.trim().replace(/^@/, "");

  if (!apiKey || !domain || !senderDomainPattern.test(domain)) {
    return { ok: false as const, reason: "configuration" as const };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send(
      {
        from: `PharmaLens <welcome@${domain}>`,
        to: [email],
        subject: "Welcome to PharmaLens",
        ...renderWelcomeEmail(appOrigin),
      },
      { idempotencyKey: `pharmalens-welcome-${userId}` },
    );

    return error ? { ok: false as const, reason: "provider" as const } : { ok: true as const };
  } catch {
    return { ok: false as const, reason: "provider" as const };
  }
}
