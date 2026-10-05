import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";
import { AuthHeading } from "@/features/auth/AuthHeading";
import { getTextTranslator } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Create account") };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <div className="auth-card register-card">
      <AuthHeading mode="register" />
      <AuthForm mode="register" initialNotice={notice === "account-exists" ? notice : undefined} />
    </div>
  );
}
