import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";
import { AuthHeading } from "@/features/auth/AuthHeading";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Sign in") };
}

export default function LoginPage() {
  return (
    <div className="auth-card">
      <AuthHeading mode="login" />
      <AuthForm mode="login" />
    </div>
  );
}
