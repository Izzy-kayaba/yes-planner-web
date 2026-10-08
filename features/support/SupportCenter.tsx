"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { YesSelect } from "@/components/ui/YesSelect";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult } from "@/lib/api/contracts";
import { supportCategories } from "@/lib/support/contracts";

type SupportRequest = {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function isSupportCategory(value: string): value is (typeof supportCategories)[number] {
  return (supportCategories as readonly string[]).includes(value);
}

export function SupportCenter({
  relatedWeddingKey,
  demoMode = false,
}: {
  relatedWeddingKey?: string;
  demoMode?: boolean;
}) {
  const { text } = useLanguage();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResult<SupportRequest>["pagination"]>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [category, setCategory] = useState<(typeof supportCategories)[number]>("Account");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadRequests(nextPage: number) {
    if (demoMode) {
      try {
        const saved = window.localStorage.getItem("yesplanner:demo:support");
        const allRequests = saved ? (JSON.parse(saved) as SupportRequest[]) : [];
        const start = (nextPage - 1) * 10;
        setRequests(allRequests.slice(start, start + 10));
        setPagination({
          page: nextPage,
          pageSize: 10,
          totalItems: allRequests.length,
          totalPages: Math.ceil(allRequests.length / 10),
          hasNextPage: nextPage * 10 < allRequests.length,
          hasPreviousPage: nextPage > 1 && allRequests.length > 0,
        });
        setPage(nextPage);
      } catch {
        toast.error(text("Support requests could not be loaded."));
      }
      return;
    }
    try {
      const result = await apiRequest<PaginatedResult<SupportRequest>>(
        `/api/v1/support-requests?page=${nextPage}&pageSize=10`,
        { cache: "no-store" },
      );
      setRequests(result.items);
      setPagination(result.pagination);
      setPage(nextPage);
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Support requests could not be loaded."),
      );
    }
  }

  useEffect(() => {
    void loadRequests(1);
  }, []);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      if (demoMode) {
        const saved = window.localStorage.getItem("yesplanner:demo:support");
        const allRequests = saved ? (JSON.parse(saved) as SupportRequest[]) : [];
        const now = new Date().toISOString();
        allRequests.unshift({
          id: crypto.randomUUID(),
          category,
          subject,
          description,
          status: "New",
          createdAt: now,
          updatedAt: now,
        });
        window.localStorage.setItem("yesplanner:demo:support", JSON.stringify(allRequests));
        setSubject("");
        setDescription("");
        toast.success(text("Demo request saved in this browser."));
        await loadRequests(1);
        return;
      }
      await apiRequest("/api/v1/support-requests", {
        method: "POST",
        body: JSON.stringify({
          category,
          subject,
          description,
          ...(relatedWeddingKey ? { relatedWeddingKey } : {}),
        }),
      });
      setSubject("");
      setDescription("");
      toast.success(text("Support request submitted."));
      await loadRequests(1);
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Support request could not be submitted."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="section-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Get help")}</p>
            <h2>{text("Contact Yes Planner support")}</h2>
          </div>
          {demoMode && (
            <p className="text-sm text-yes-muted">
              {text("Demo requests stay in this browser and are not sent to the platform team.")}
            </p>
          )}
        </div>
        <form
          className="auth-form support-request-form"
          onSubmit={(event) => void submitRequest(event)}
        >
          <div className="field">
            <span>{text("Category")}</span>
            <YesSelect
              ariaLabel={text("Category")}
              className="w-full"
              options={supportCategories.map((value) => ({ value, label: text(value) }))}
              value={category}
              onChange={(value) => {
                if (isSupportCategory(value)) setCategory(value);
              }}
            />
          </div>
          <label className="field">
            <span>{text("Subject")}</span>
            <input
              required
              minLength={5}
              maxLength={160}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
          <label className="field">
            <span>{text("How can we help?")}</span>
            <textarea
              required
              minLength={20}
              maxLength={4_000}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <button className="button button-primary w-fit" disabled={saving} type="submit">
            {saving ? text("Submitting…") : text("Submit support request")}
          </button>
        </form>
      </article>
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Your account")}</p>
            <h2>{text("Your support requests")}</h2>
          </div>
        </div>
        {requests.length ? (
          <div className="request-list">
            {requests.map((request) => (
              <div key={request.id}>
                <p>
                  <strong>{request.subject}</strong>
                  <small>
                    {text(request.category)} · {text(request.status)}
                  </small>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-yes-muted">
            {text("You have not submitted any requests yet.")}
          </p>
        )}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.totalItems}
          onChange={(nextPage) => void loadRequests(nextPage)}
        />
        <span className="sr-only">
          {text("Current support page")} {page}
        </span>
      </article>
    </div>
  );
}
