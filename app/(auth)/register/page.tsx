import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";
import { AuthHeading } from "@/features/auth/AuthHeading";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Create account") };
}

export default function RegisterPage() {
  return (
    <div className="auth-card register-card">
      <AuthHeading mode="register" />
      <AuthForm mode="register" />
    </div>
  );
}
