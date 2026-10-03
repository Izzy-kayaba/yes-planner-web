import { ForgotPasswordForm } from "@/features/auth/ForgotPasswordForm";
import { getTextTranslator } from "@/lib/i18n-server";

export default async function ForgotPasswordPage() {
  const text = await getTextTranslator();
  return (
    <div className="auth-card">
      <p className="eyebrow">{text("Account recovery")}</p>
      <h2>{text("Forgot your password?")}</h2>
      <p className="auth-intro">
        {text("Enter your email and we will send you a secure, time-limited reset link.")}
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
