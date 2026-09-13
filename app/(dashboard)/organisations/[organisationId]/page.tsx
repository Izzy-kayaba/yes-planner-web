import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/ui/ActionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { getInitials } from "@/lib/initials";

export const metadata: Metadata = { title: "Organisation" };

export default function OrganisationPage() {
  const weddings = [
    { couple: "Amara & Sipho", date: "18 Oct 2026", progress: 68, owner: "Lerato", tone: "rose" },
    { couple: "Jessica & Liam", date: "07 Nov 2026", progress: 54, owner: "Thabo", tone: "sage" },
    { couple: "Nandi & Sam", date: "13 Dec 2026", progress: 41, owner: "Naledi", tone: "gold" },
  ];
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Planning organisation"
        title="Beautiful Day Events"
        description="A shared view of clients, team capacity and the work ahead."
        action={
          <ActionButton
            className="button button-primary"
            message="A new wedding draft was created."
            doneLabel="Draft created"
          >
            ＋ New wedding
          </ActionButton>
        }
      />
      <MetricCards />
      <section className="dashboard-grid org-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Wedding portfolio</p>
              <h3>Active celebrations</h3>
            </div>
            <ActionButton
              className="button button-secondary"
              message="All active celebrations are shown."
            >
              View all
            </ActionButton>
          </div>
          <div className="wedding-portfolio">
            {weddings.map((wedding) => (
              <div key={wedding.couple}>
                <span className={`portfolio-mark tone-${wedding.tone}`}>
                  {getInitials(wedding.couple)}
                </span>
                <p>
                  <strong>{wedding.couple}</strong>
                  <small>
                    {wedding.date} · Lead: {wedding.owner}
                  </small>
                </p>
                <div>
                  <span>
                    <i style={{ width: `${wedding.progress}%` }} />
                  </span>
                  <small>{wedding.progress}%</small>
                </div>
                <Link href="/weddings/amara-sipho" aria-label={`Open ${wedding.couple}`}>
                  ›
                </Link>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Request queue</p>
              <h3>New opportunities</h3>
            </div>
            <StatusPill tone="gold">3 pending</StatusPill>
          </div>
          <div className="request-list">
            <div>
              <span className="avatar">KM</span>
              <p>
                <strong>Karabo & Musa</strong>
                <small>28 February 2027 · Pretoria</small>
              </p>
              <ActionButton
                className="button button-secondary"
                message="Karabo and Musa's request was reviewed."
                doneLabel="Reviewed"
              >
                Review
              </ActionButton>
            </div>
            <div>
              <span className="avatar">ZN</span>
              <p>
                <strong>Zinhle & Neo</strong>
                <small>17 April 2027 · Sandton</small>
              </p>
              <ActionButton
                className="button button-secondary"
                message="Zinhle and Neo's request was reviewed."
                doneLabel="Reviewed"
              >
                Review
              </ActionButton>
            </div>
            <div>
              <span className="avatar">JL</span>
              <p>
                <strong>Julia & Lesedi</strong>
                <small>06 June 2027 · Magaliesburg</small>
              </p>
              <ActionButton
                className="button button-secondary"
                message="Julia and Lesedi's request was reviewed."
                doneLabel="Reviewed"
              >
                Review
              </ActionButton>
            </div>
          </div>
        </article>
      </section>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Team workload</p>
              <h3>This week’s capacity</h3>
            </div>
            <ActionButton className="button button-secondary" message="Team management opened.">
              Manage team
            </ActionButton>
          </div>
          <div className="workload-list">
            {[
              ["Lerato Maseko", "6 tasks", 72],
              ["Thabo Ndlovu", "4 tasks", 48],
              ["Naledi Jacobs", "8 tasks", 86],
              ["Mia Daniels", "3 tasks", 34],
            ].map(([name, task, value]) => (
              <div key={name}>
                <span className="avatar">{getInitials(String(name))}</span>
                <p>
                  <strong>{name}</strong>
                  <small>{task} due</small>
                </p>
                <div>
                  <i style={{ width: `${value}%` }} />
                </div>
                <small>{value}%</small>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Financial overview</p>
              <h3>September revenue</h3>
            </div>
            <StatusPill tone="sage">+12.4%</StatusPill>
          </div>
          <div className="revenue-number">
            R 248,500<small>R 82,000 awaiting payment</small>
          </div>
          <div className="mini-chart">
            {[35, 52, 46, 68, 58, 74, 82, 65, 88, 76, 92, 84].map((height, index) => (
              <i style={{ height: `${height}%` }} key={index} />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function MetricCards() {
  return (
    <section className="stats-grid">
      <StatCard label="Active weddings" value="6" detail="3 in the next 90 days" tone="rose" />
      <StatCard label="Tasks due soon" value="21" detail="5 high priority" tone="gold" />
      <StatCard label="Team utilisation" value="74%" detail="Healthy capacity" tone="sage" />
      <StatCard label="Open requests" value="3" detail="2 new this week" tone="blue" />
    </section>
  );
}
