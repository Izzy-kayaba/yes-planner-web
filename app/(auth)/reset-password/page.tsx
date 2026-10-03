import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";
import { getTextTranslator } from "@/lib/i18n-server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const values = await searchParams;
  const text = await getTextTranslator();
  return (
    <div className="auth-card">
      <p className="eyebrow">{text("Account security")}</p>
      <h2>{text("Choose a new password")}</h2>
      <p className="auth-intro">{text("Use a strong password you have not used before.")}</p>
      <ResetPasswordForm token={values.token} invalid={Boolean(values.error)} />
    </div>
  );
}
