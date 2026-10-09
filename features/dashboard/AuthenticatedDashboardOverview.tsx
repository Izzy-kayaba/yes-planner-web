"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import type { DashboardData } from "@/lib/dashboard/types";
import { daysUntil, formatDate, greetingForNow } from "@/lib/date-time";
import { budgetRanges, guestRanges, inferGuestRange, inferMoneyRange } from "@/lib/estimate-ranges";

export function AuthenticatedDashboardOverview({ data }: { data: DashboardData }) {
  const { language, text } = useLanguage();
  const { displayMoney } = useCurrency();
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => setGreeting(greetingForNow(language)), [language]);

  if (!data.wedding) {
    return (
      <div className="dashboard-stack">
        <PageHeader
          eyebrow={formatDate(new Date(), "dddd, D MMMM", language)}
          title={`${text(greeting)}, ${data.user.firstName}`}
          description={text("Your account is ready. Open the workspace for your role to continue.")}
        />
        <div className="alert alert-info">
          {text("Complete your role workspace to unlock its planning tools.")}
        </div>
      </div>
    );
  }

  const wedding = data.wedding;
  const daysRemaining = daysUntil(wedding.weddingDate);
  const budgetRange = budgetRanges.find(
    (range) =>
      range.id === (wedding.budgetRangeKey || inferMoneyRange(budgetRanges, wedding.budgetMinor)),
  );
  const guestRange = guestRanges.find(
    (range) => range.id === (wedding.guestRangeKey || inferGuestRange(wedding.estimatedGuests)),
  );
  const budgetLabel = budgetRange
    ? budgetRange.maxMinor === null
      ? `${displayMoney(budgetRange.minMinor)}+`
      : `${displayMoney(budgetRange.minMinor)} – ${displayMoney(budgetRange.maxMinor)}`
    : displayMoney(wedding.budgetMinor);
  const guestLabel = guestRange
    ? guestRange.max === null
      ? `${guestRange.min}+`
      : `${guestRange.min} – ${guestRange.max}`
    : String(wedding.estimatedGuests);

  return (
    <div className="dashboard-stack">
      <PageHeader
        eyebrow={formatDate(new Date(), "dddd, D MMMM", language)}
        title={`${text(greeting)}, ${data.user.firstName}`}
        description={text("Here is what is happening across your wedding workspace.")}
        action={
          <Link className="button button-primary" href={`/weddings/${wedding.weddingKey}`}>
            {text("Open wedding")} <span>→</span>
          </Link>
        }
      />

      <section className="wedding-banner">
        <div className="banner-copy">
          <StatusPill tone="rose">{text("Your wedding")}</StatusPill>
          <h2>{wedding.displayName}</h2>
          <p>
            {formatDate(wedding.weddingDate, "D MMMM YYYY", language)}
            <span> · </span>
            {wedding.venue}, {wedding.location}
          </p>
          <p className="text-sm">
            {text("Planned budget")}: {budgetLabel} · {guestLabel} {text("estimated guests")}
          </p>
          {data.user.role === "Couple" && (
            <Link className="button button-secondary" href="/onboarding">
              {text("Edit wedding details")} <span>→</span>
            </Link>
          )}
        </div>
        <div className="countdown-block">
          <span>{text("Only")}</span>
          <strong>{daysRemaining}</strong>
          <em>{text("days to go")}</em>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label={text("Guests attending")}
          value={String(data.counts.attendingGuests)}
          detail={`${data.counts.guests} ${text("guest records")}`}
          tone="sage"
        />
        <StatCard
          label={text("Tasks completed")}
          value={String(data.counts.completedTasks)}
          detail={`${Math.max(0, data.counts.tasks - data.counts.completedTasks)} ${text("still open")}`}
          tone="gold"
        />
        <StatCard
          label={text("Vendors confirmed")}
          value={String(data.counts.confirmedVendors)}
          detail={`${data.counts.vendors} ${text("vendor records")}`}
          tone="blue"
        />
        <StatCard
          label={text("Unread messages")}
          value={String(data.counts.unreadMessages)}
          detail={text(
            data.counts.unreadMessages ? "Needs your attention" : "You're all caught up",
          )}
          tone="rose"
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel focus-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{text("Your focus")}</p>
              <h3>{text("Planning tasks")}</h3>
            </div>
            <Link href={`/weddings/${wedding.weddingKey}/tasks`}>{text("View tasks")} →</Link>
          </div>
          {data.tasks.length ? (
            <div className="task-list compact">
              {data.tasks.map((task) => (
                <div className={`task-row ${task.complete ? "complete" : ""}`} key={task.id}>
                  <span className="check-box">{task.complete ? "✓" : ""}</span>
                  <span className="task-copy">
                    <strong>{task.title}</strong>
                    <small>{[task.category, task.assignee].filter(Boolean).join(" · ")}</small>
                  </span>
                  <span>{task.due}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-yes-muted">
              {text("No tasks yet. Add your first task from the wedding workspace.")}
            </p>
          )}
        </article>
        <article className="panel">
          <p className="eyebrow">{text("Vendor marketplace")}</p>
          <h3>{text("Build your wedding team")}</h3>
          <p className="mt-2 text-sm text-yes-muted">
            {text("Open a vendor profile to contact them directly on WhatsApp.")}
          </p>
          <div className="dashboard-vendor-actions flex gap-2 mt-3">
            <Link className="button button-secondary" href="/marketplace">
              {text("Browse vendors")}
            </Link>
            <Link className="button button-secondary" href="/messages">
              {text("Open messages")}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
