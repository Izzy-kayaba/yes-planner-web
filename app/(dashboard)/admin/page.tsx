import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { ActionButton, DownloadReportButton } from "@/components/ui/ActionButton";

export const metadata: Metadata = { title: "Platform administration" };

export default function AdminPage() {
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Platform administration"
        title="Vow Planner operations"
        description="A focused view of platform health, verification and support."
        action={<DownloadReportButton />}
      />
      <section className="stats-grid">
        <StatCard label="Active weddings" value="1,284" detail="+8.2% this month" tone="rose" />
        <StatCard label="Organisations" value="438" detail="62 pending verification" tone="sage" />
        <StatCard label="Monthly users" value="8,920" detail="71% returning" tone="blue" />
        <StatCard label="Open support cases" value="24" detail="5 require attention" tone="gold" />
      </section>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Verification queue</p>
              <h3>Professional profiles</h3>
            </div>
            <ActionButton className="button button-secondary" message="Verification queue opened.">
              View all 62
            </ActionButton>
          </div>
          <div className="request-list">
            <div>
              <span className="avatar">BE</span>
              <p>
                <strong>Bloom Events</strong>
                <small>Wedding planner · Johannesburg</small>
              </p>
              <StatusPill tone="gold">Documents ready</StatusPill>
            </div>
            <div>
              <span className="avatar">CV</span>
              <p>
                <strong>Clay Venue</strong>
                <small>Venue · Cape Town</small>
              </p>
              <StatusPill tone="rose">Needs review</StatusPill>
            </div>
            <div>
              <span className="avatar">SP</span>
              <p>
                <strong>Still & Poem</strong>
                <small>Photography · Durban</small>
              </p>
              <StatusPill tone="gold">Documents ready</StatusPill>
            </div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Platform health</p>
              <h3>All systems operational</h3>
            </div>
            <span className="health-dot" />
          </div>
          <div className="health-list">
            <div>
              <span>API availability</span>
              <strong>99.99%</strong>
            </div>
            <div>
              <span>Median response time</span>
              <strong>184 ms</strong>
            </div>
            <div>
              <span>Failed background jobs</span>
              <strong>0</strong>
            </div>
            <div>
              <span>Security alerts</span>
              <strong>0 open</strong>
            </div>
          </div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Recent sensitive actions</p>
            <h3>Audit activity</h3>
          </div>
          <ActionButton className="button button-secondary" message="Audit log opened.">
            Open audit log
          </ActionButton>
        </div>
        <div className="audit-list">
          <div>
            <time>09:41</time>
            <span className="activity-dot rose">O</span>
            <p>
              <strong>Wedding ownership transferred</strong>
              <small>Actor: support@vowplanner.co.za · Wedding ending 48D2</small>
            </p>
            <StatusPill tone="neutral">Ownership</StatusPill>
          </div>
          <div>
            <time>08:22</time>
            <span className="activity-dot sage">V</span>
            <p>
              <strong>Vendor organisation verified</strong>
              <small>Actor: operations@vowplanner.co.za · Bloom Events</small>
            </p>
            <StatusPill tone="sage">Verification</StatusPill>
          </div>
          <div>
            <time>Yesterday</time>
            <span className="activity-dot gold">P</span>
            <p>
              <strong>Subscription refund approved</strong>
              <small>Actor: finance@vowplanner.co.za · REF-2071</small>
            </p>
            <StatusPill tone="gold">Finance</StatusPill>
          </div>
        </div>
      </section>
    </div>
  );
}
