"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { apiRequest } from "@/lib/api/client";
import { useLanguage } from "@/components/providers/LanguageProvider";

type InvitationDetails = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export function PlatformInvitationAcceptance({ token }: { token: string }) {
  const { text } = useLanguage();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<InvitationDetails>(`/api/v1/platform-invitations/${encodeURIComponent(token)}`)
      .then((result) => {
        if (active) setInvitation(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "This platform invitation is invalid or has expired.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(text("Passwords do not match."));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/v1/platform-invitations/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setAccepted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Your platform account could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-width grid min-h-screen place-items-center py-10">
      <section className="auth-card w-full max-w-xl">
        <p className="eyebrow">{text("Platform invitation")}</p>
        {loading ? (
          <p aria-live="polite" className="mt-4 text-sm text-yes-muted">
            {text("Checking invitation…")}
          </p>
        ) : accepted ? (
          <>
            <h1>{text("Your account is ready")}</h1>
            <p className="mt-3 text-sm text-yes-muted">
              {text(
                "Check your email to verify your account, then sign in to access the platform.",
              )}
            </p>
            <Link className="button button-primary mt-6 inline-flex" href="/login">
              {text("Go to sign in")}
            </Link>
          </>
        ) : invitation ? (
          <>
            <h1>{text("Join the Yes Planner platform team")}</h1>
            <p className="mt-3 text-sm text-yes-muted">
              {text("You have been invited to join as")} <strong>{text(invitation.role)}</strong>.
            </p>
            <p className="mt-1 text-sm text-yes-muted">
              {invitation.firstName} {invitation.lastName} · {invitation.email}
            </p>
            <form className="mt-6 grid gap-4" onSubmit={(event) => void submit(event)}>
              <label className="grid gap-1.5 text-sm font-bold">
                <span>{text("Create a password")}</span>
                <PasswordInput
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <small className="font-normal text-yes-muted">
                  {text("Use at least 8 characters, including a number and a symbol.")}
                </small>
              </label>
              <label className="grid gap-1.5 text-sm font-bold">
                <span>{text("Confirm password")}</span>
                <PasswordInput
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
              {error && (
                <p aria-live="polite" className="text-sm text-yes-wine">
                  {text(error)}
                </p>
              )}
              <Button className="w-full" disabled={saving} type="submit">
                {text(saving ? "Creating account…" : "Accept invitation")}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1>{text("Invitation unavailable")}</h1>
            <p aria-live="polite" className="mt-3 text-sm text-yes-muted">
              {text(error || "This platform invitation is invalid or has expired.")}
            </p>
            <Link className="text-link mt-5 inline-flex" href="/login">
              {text("Return to sign in")}
            </Link>
          </>
        )}
        {error && invitation && (
          <p aria-live="polite" className="mt-4 text-sm text-yes-wine">
            {text(error)}
          </p>
        )}
      </section>
    </main>
  );
}
