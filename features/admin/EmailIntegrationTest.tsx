"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { useLanguage } from "@/components/providers/LanguageProvider";

type EmailTestStatus = {
  configured: boolean;
  lastTest: { status: "success" | "failure"; createdAt: string } | null;
};

export function EmailIntegrationTest({ initialStatus }: { initialStatus: EmailTestStatus }) {
  const { text } = useLanguage();
  const [status, setStatus] = useState(initialStatus);
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);

  async function sendTest() {
    setSending(true);
    try {
      await apiRequest("/api/v1/admin/system/email-test", {
        method: "POST",
        body: JSON.stringify({ recipient }),
      });
      setStatus({
        ...status,
        lastTest: { status: "success", createdAt: new Date().toISOString() },
      });
      toast.success(text("Test email sent."));
    } catch (error) {
      setStatus({
        ...status,
        lastTest: { status: "failure", createdAt: new Date().toISOString() },
      });
      toast.error(text(error instanceof Error ? error.message : "Email test failed."));
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{text("System integration")}</p>
          <h2>{text("Email")}</h2>
        </div>
        <strong>{text(status.configured ? "Configured" : "Not configured")}</strong>
      </div>
      <p className="text-sm text-yes-muted">
        {text(
          "Test the same Resend email service used by account notifications. Secrets stay on the server.",
        )}
      </p>
      {status.lastTest && (
        <p className="text-sm text-yes-muted">
          {text("Last test")}: {text(status.lastTest.status === "success" ? "Healthy" : "Failed")} ·{" "}
          {new Date(status.lastTest.createdAt).toLocaleString()}
        </p>
      )}
      <div className="settings-form mt-4 max-w-xl">
        <label>
          <span>{text("Test recipient")}</span>
          <input
            type="email"
            autoComplete="email"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button
          className="button button-primary w-fit"
          type="button"
          disabled={!status.configured || sending || !recipient.trim()}
          onClick={() => void sendTest()}
        >
          {sending ? text("Sending…") : text("Send test email")}
        </button>
      </div>
    </article>
  );
}
