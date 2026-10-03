import "server-only";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Password email delivery is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Yes Planner password",
      text: `Use this secure link to reset your Yes Planner password: ${resetUrl}\n\nThis link expires in one hour. If you did not request it, you can ignore this email.`,
    }),
  });
  if (!response.ok) throw new Error("Password reset email could not be sent.");
}
