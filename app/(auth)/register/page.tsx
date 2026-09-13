import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/AuthForm";
import { AuthHeading } from "@/features/auth/AuthHeading";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="auth-card register-card">
      <AuthHeading mode="register" />
      <AuthForm mode="register" />
    </div>
  );
}
