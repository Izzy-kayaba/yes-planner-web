import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";
import { AuthHeading } from "@/features/auth/AuthHeading";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="auth-card">
      <AuthHeading mode="login" />
      <AuthForm mode="login" />
    </div>
  );
}
