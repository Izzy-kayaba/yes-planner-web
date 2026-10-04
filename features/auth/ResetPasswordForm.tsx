"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FieldLabel } from "@/components/forms/FieldLabel";
import { PasswordInput } from "@/components/forms/PasswordInput";

export function ResetPasswordForm({ token, invalid }: { token?: string; invalid: boolean }) {
  const { text } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  if (invalid || !token)
    return (
      <div className="alert alert-error">
        {text("This reset link is invalid or has expired.")}{" "}
        <Link href="/forgot-password">{text("Request another link")}</Link>
      </div>
    );
  if (complete)
    return (
      <div className="alert alert-success">
        {text("Your password has been reset.")} <Link href="/login">{text("Sign in")}</Link>
      </div>
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8 || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError(text("Use at least 8 characters with a number and a symbol."));
      return;
    }
    if (password !== confirmation) {
      setError(text("Passwords do not match."));
      return;
    }
    setSaving(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setSaving(false);
    if (result.error) setError(text("This reset link is invalid or has expired."));
    else setComplete(true);
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <label>
        <FieldLabel required>{text("New password")}</FieldLabel>
        <PasswordInput
          id="reset-password"
          name="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label>
        <FieldLabel required>{text("Confirm password")}</FieldLabel>
        <PasswordInput
          id="reset-password-confirmation"
          name="passwordConfirmation"
          required
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </label>
      <Button disabled={saving} fullWidth type="submit">
        {text("Reset password")}
      </Button>
    </form>
  );
}
