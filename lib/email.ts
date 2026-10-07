import "server-only";

const brandName = process.env.EMAIL_BRAND_NAME ?? "Yes Planner";
const accentColor = /^#[0-9a-fA-F]{6}$/.test(process.env.EMAIL_ACCENT_COLOR ?? "")
  ? process.env.EMAIL_ACCENT_COLOR!
  : "#7a3348";

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

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Resend email delivery is not configured.");
  if (!to) throw new Error("Email delivery requires a recipient address.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Resend rejected the email (${response.status}): ${responseText.slice(0, 500) || "unknown error"}`,
    );
  }
}

function emailContent(title: string, message: string, actionUrl?: string, actionLabel?: string) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const action =
    actionUrl && actionLabel
      ? `<p style="margin:28px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">${escapeHtml(actionLabel)}</a></p>`
      : "";
  const text = [title, message, actionUrl && actionLabel ? `${actionLabel}: ${actionUrl}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f7f4f2;font-family:Arial,sans-serif;color:#302a2b"><div style="max-width:600px;margin:32px auto;padding:32px;background:#fff;border-radius:12px"><p style="margin:0 0 24px;color:${accentColor};font-weight:700">${escapeHtml(brandName)}</p><h1 style="font-size:24px;margin:0 0 16px">${safeTitle}</h1><p style="font-size:16px;line-height:1.6">${safeMessage}</p>${action}<p style="margin:32px 0 0;color:#756d6f;font-size:13px">If you did not expect this email, you can safely ignore it.</p></div></body></html>`;
  return { text, html };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const subject = `Reset your ${brandName} password`;
  const { text, html } = emailContent(
    "Reset your password",
    "Use this secure link to choose a new password. This link expires in one hour.",
    resetUrl,
    "Choose a new password",
  );
  await sendEmail(to, subject, text, html);
}

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  const subject = `Verify your ${brandName} email`;
  const { text, html } = emailContent(
    "Verify your email",
    "Confirm your email address to secure your account and connect sign-in methods.",
    verificationUrl,
    "Verify email address",
  );
  await sendEmail(to, subject, text, html);
}

export async function sendEventEmail(to: string, subject: string, message: string) {
  const { text, html } = emailContent(subject, message);
  await sendEmail(to, subject, text, html);
}
