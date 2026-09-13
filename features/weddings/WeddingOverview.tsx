"use client";

import Link from "next/link";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  budgetCategories,
  currentWedding,
  upcomingEvents,
  vendors,
  weddingStats,
} from "@/lib/demo-data";

export function WeddingOverview() {
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
            Edit wedding details
          </button>
        }
      />
      <section className="overview-hero">
        <div>
          <StatusPill tone="sage">Planning beautifully</StatusPill>
          <h2>{currentWedding.daysRemaining} days until “I do”</h2>
          <p>
            You’re {currentWedding.progress}% of the way there. Six high-priority details need
            attention this week.
          </p>
          <Link className="button button-light" href={`/weddings/${currentWedding.id}/tasks`}>
            Review this week →
          </Link>
        </div>
        <div
          className="overview-ring"
          style={{ "--progress": `${currentWedding.progress}%` } as React.CSSProperties}
        >
          <span>
            <strong>{currentWedding.progress}%</strong>ready
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
              <p className="eyebrow">Budget shape</p>
              <h3>R 335,500 committed</h3>
            </div>
            <Link href={`/weddings/${currentWedding.id}/budget`}>Details →</Link>
          </div>
          <div className="budget-bars mini">
            {budgetCategories.map((item) => (
              <div key={item.name}>
                <span>
                  <b>{item.name}</b>
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
              <p className="eyebrow">Next on the calendar</p>
              <h3>Three important dates</h3>
            </div>
            <Link href={`/weddings/${currentWedding.id}/timeline`}>Calendar →</Link>
          </div>
          <div className="event-list">
            {upcomingEvents.map((event) => (
              <div className="event-row" key={event.title}>
                <div className={`date-tile tone-${event.color}`}>
                  <strong>{event.day}</strong>
                  <span>{event.month}</span>
                </div>
                <div>
                  <strong>{event.title}</strong>
                  <span>{event.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Creative team</p>
            <h3>Your confirmed partners</h3>
          </div>
          <Link href={`/weddings/${currentWedding.id}/vendors`}>Manage vendors →</Link>
        </div>
        <div className="vendor-lineup">
          {vendors.slice(0, 4).map((vendor) => (
            <div key={vendor.name}>
              <span className={`vendor-avatar tone-${vendor.tone}`}>{vendor.initials}</span>
              <p>
                <strong>{vendor.name}</strong>
                <small>{vendor.category}</small>
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
