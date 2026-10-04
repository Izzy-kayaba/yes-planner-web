"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FieldLabel } from "@/components/forms/FieldLabel";

export function ForgotPasswordForm() {
  const { text } = useLanguage();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (result.error) {
      setError(result.error.message ?? text("Password reset request failed."));
      return;
    }
    setSent(true);
  }
  if (sent)
    return (
      <div className="alert alert-success">
        {text("If that account exists, a secure reset link has been sent.")}
      </div>
    );
  return (
    <form className="auth-form" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <label>
        <FieldLabel required>{text("Email address")}</FieldLabel>
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <Button disabled={sending} fullWidth type="submit">
        {text("Send reset link")}
      </Button>
      <p className="auth-switch">
        <Link href="/login">{text("Back to sign in")}</Link>
      </p>
    </form>
  );
}
