import "server-only";

const brandName = process.env.EMAIL_BRAND_NAME ?? "Yes Planner";
const accentColor = /^#[0-9a-fA-F]{6}$/.test(process.env.EMAIL_ACCENT_COLOR ?? "")
  ? process.env.EMAIL_ACCENT_COLOR!
  : "#7a3348";

// Resend accepts either a plain address or a display name followed by an address.
const emailAddressPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

function isValidSender(value: string | undefined) {
  if (!value?.trim()) return false;
  const sender = value.trim();
  const namedSender = sender.match(/^.+<([^<>]+)>$/);
  const address = namedSender?.[1]?.trim() ?? sender;
  if (/your(?:-verified)?-?domain\.com|yourdomain\.com/i.test(address)) return false;
  return emailAddressPattern.test(address);
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && isValidSender(process.env.AUTH_EMAIL_FROM));
}

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
  if (!isValidSender(from)) {
    throw new Error(
      'AUTH_EMAIL_FROM must use a verified sender formatted as "email@example.com" or "Name <email@example.com>".',
    );
  }
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
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 8px"><tr><td style="border-radius:10px;background:${accentColor}"><a href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 22px;border:1px solid ${accentColor};border-radius:10px;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none">${escapeHtml(actionLabel)} &nbsp;→</a></td></tr></table>`
      : "";
  const text = [title, message, actionUrl && actionLabel ? `${actionLabel}: ${actionUrl}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const html = `<!doctype html><html><head><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;padding:0;background:#f7f3f0;color:#302a2b;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${safeTitle} · ${escapeHtml(brandName)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f3f0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px"><tr><td style="padding:0 8px 18px"><span style="color:${accentColor};font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-.02em">${escapeHtml(brandName)}</span></td></tr><tr><td style="padding:0;background:#ffffff;border:1px solid #eadfd9;border-radius:16px;box-shadow:0 8px 24px rgba(76,48,38,.06)"><div style="padding:36px 34px 32px"><div style="width:42px;height:4px;margin:0 0 24px;border-radius:99px;background:${accentColor}"></div><h1 style="margin:0 0 16px;color:#302a2b;font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.2;letter-spacing:-.03em">${safeTitle}</h1><p style="margin:0;color:#645956;font-size:16px;line-height:1.7">${safeMessage}</p>${action}<p style="margin:30px 0 0;color:#8a7e78;font-size:13px;line-height:1.6">If you did not expect this email, you can safely ignore it.</p></div></td></tr><tr><td style="padding:20px 8px 0;color:#8a7e78;font-size:12px;line-height:1.5">You are receiving this message from ${escapeHtml(brandName)}.</td></tr></table></td></tr></table></body></html>`;
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

export async function sendEventEmail(
  to: string,
  subject: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string,
) {
  const { text, html } = emailContent(subject, message, actionUrl, actionLabel);
  await sendEmail(to, subject, text, html);
}

export async function sendPlatformStaffInvitationEmail(
  to: string,
  inviterName: string,
  role: string,
  invitationUrl: string,
) {
  const subject = `You are invited to join ${brandName}`;
  const message = `${inviterName} invited you to join Yes Planner as a ${role}. This invitation expires in 7 days.`;
  const { text, html } = emailContent(
    "Join the Yes Planner platform team",
    message,
    invitationUrl,
    "Accept invitation",
  );
  await sendEmail(to, subject, text, html);
}
