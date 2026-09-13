"use client";

import Link from "next/link";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  budgetCategories,
  currentWedding,
  upcomingEvents,
  vendors,
  weddingStats,
} from "@/lib/demo-data";

export function WeddingOverview() {
  const { text } = useLanguage();
  const [details, setDetails] = useState(currentWedding);
  const [editing, setEditing] = useState(false);

  function saveDetails(values: Record<string, EntityFormValue>) {
    setDetails((current) => ({
      ...current,
      ...(values as unknown as Pick<
        typeof currentWedding,
        "partnerNames" | "date" | "venue" | "city"
      >),
    }));
  }

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Wedding overview"
        title={details.partnerNames}
        description={`${details.date} · ${details.venue}, ${details.city}`}
        action={
          <button className="button button-secondary" onClick={() => setEditing(true)}>
            {text("Edit wedding details")}
          </button>
        }
      />
      <section className="overview-hero">
        <div>
          <StatusPill tone="sage">Planning beautifully</StatusPill>
          <h2>
            {currentWedding.daysRemaining} {text("days until “I do”")}
          </h2>
          <p>
            {text("You’re")} {currentWedding.progress}% {text("of the way there.")}{" "}
            {text("Six high-priority details need attention this week.")}
          </p>
          <Link className="button button-light" href={`/weddings/${currentWedding.id}/tasks`}>
            {text("Review this week →")}
          </Link>
        </div>
        <div
          className="overview-ring"
          style={{ "--progress": `${currentWedding.progress}%` } as React.CSSProperties}
        >
          <span>
            <strong>{currentWedding.progress}%</strong>
            {text("ready")}
          </span>
        </div>
      </section>
      <section className="stats-grid">
        {weddingStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{text("Budget shape")}</p>
              <h3>R 335,500 {text("committed")}</h3>
            </div>
            <Link href={`/weddings/${currentWedding.id}/budget`}>{text("Details →")}</Link>
          </div>
          <div className="budget-bars mini">
            {budgetCategories.map((item) => (
              <div key={item.name}>
                <span>
                  <b>{text(item.name)}</b>
                  <small>R {item.amount.toLocaleString()}</small>
                </span>
                <div>
                  <i
                    style={{
                      width: `${(item.amount / item.budget) * 100}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{text("Next on the calendar")}</p>
              <h3>{text("Three important dates")}</h3>
            </div>
            <Link href={`/weddings/${currentWedding.id}/timeline`}>{text("Calendar →")}</Link>
          </div>
          <div className="event-list">
            {upcomingEvents.map((event) => (
              <div className="event-row" key={event.title}>
                <div className={`date-tile tone-${event.color}`}>
                  <strong>{event.day}</strong>
                  <span>{event.month}</span>
                </div>
                <div>
                  <strong>{text(event.title)}</strong>
                  <span>{text(event.meta)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Creative team")}</p>
            <h3>{text("Your confirmed partners")}</h3>
          </div>
          <Link href={`/weddings/${currentWedding.id}/vendors`}>{text("Manage vendors →")}</Link>
        </div>
        <div className="vendor-lineup">
          {vendors.slice(0, 4).map((vendor) => (
            <div key={vendor.name}>
              <span className={`vendor-avatar tone-${vendor.tone}`}>{vendor.initials}</span>
              <p>
                <strong>{vendor.name}</strong>
                <small>{text(vendor.category)}</small>
              </p>
              <StatusPill tone="sage">{vendor.status}</StatusPill>
            </div>
          ))}
        </div>
      </section>
      <EntityDialog
        open={editing}
        title="Edit wedding details"
        fields={[
          { name: "partnerNames", label: "Couple names", required: true },
          { name: "date", label: "Wedding date", required: true },
          { name: "venue", label: "Venue", required: true },
          { name: "city", label: "City", required: true },
        ]}
        initialValues={details}
        onClose={() => setEditing(false)}
        onSave={saveDetails}
      />
    </div>
  );
}
