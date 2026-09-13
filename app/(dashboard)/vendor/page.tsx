import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";

export const metadata: Metadata = { title: "Vendor portal" };

export default function VendorPage() {
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Lumen & Lace Studio"
        title="Good morning, Zoë"
        description="Your bookings, enquiries and client moments for the week."
        action={
          <Link className="button button-primary" href="/settings">
            Edit public profile
          </Link>
        }
      />
      <section className="stats-grid">
        <StatCard label="Confirmed bookings" value="12" detail="Next 6 months" tone="rose" />
        <StatCard label="Open enquiries" value="5" detail="2 awaiting your reply" tone="gold" />
        <StatCard label="Revenue booked" value="R 386k" detail="+18% year on year" tone="sage" />
        <StatCard label="Average rating" value="4.9" detail="from 48 reviews" tone="blue" />
      </section>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Booking requests</p>
              <h3>Ready for your response</h3>
            </div>
            <Link className="button button-secondary" href="/weddings/amara-sipho/messages">
              View inbox
            </Link>
          </div>
          <div className="request-list">
            <div>
              <span className="avatar">KN</span>
              <p>
                <strong>Karabo & Neo</strong>
                <small>21 March 2027 · Full-day photography</small>
              </p>
              <StatusPill tone="gold">New</StatusPill>
            </div>
            <div>
              <span className="avatar">NS</span>
              <p>
                <strong>Nandi & Sam</strong>
                <small>13 December 2026 · Photo + film</small>
              </p>
              <StatusPill tone="rose">Follow up</StatusPill>
            </div>
            <div>
              <span className="avatar">JL</span>
              <p>
                <strong>Jessica & Liam</strong>
                <small>07 November 2026 · Album add-on</small>
              </p>
              <StatusPill tone="neutral">Quote sent</StatusPill>
            </div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Next booking</p>
              <h3>Amara & Sipho</h3>
            </div>
            <StatusPill tone="sage">Confirmed</StatusPill>
          </div>
          <div className="next-booking">
            <strong>18</strong>
            <span>
              OCT
              <br />
              2026
            </span>
            <div>
              <p>Shepstone Gardens</p>
              <small>Johannesburg · 12:30 arrival</small>
            </div>
          </div>
          <div className="booking-checklist">
            <span>
              <i>✓</i>Contract signed
            </span>
            <span>
              <i>✓</i>Deposit received
            </span>
            <span>
              <i>○</i>Final timeline approval
            </span>
          </div>
          <Link className="button button-secondary button-wide" href="/weddings/amara-sipho">
            Open wedding brief
          </Link>
        </article>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Performance</p>
            <h3>Enquiries to confirmed bookings</h3>
          </div>
          <select className="button button-secondary" aria-label="Performance period">
            <option>Last 6 months</option>
            <option>Last 12 months</option>
            <option>This year</option>
          </select>
        </div>
        <div className="performance-layout">
          <div className="conversion-ring">
            <span>
              <b>64%</b>conversion
            </span>
          </div>
          <div className="performance-stats">
            <div>
              <span>Average response</span>
              <strong>2h 18m</strong>
            </div>
            <div>
              <span>Profile views</span>
              <strong>1,284</strong>
            </div>
            <div>
              <span>Package saves</span>
              <strong>219</strong>
            </div>
          </div>
          <div className="mini-chart wide">
            {[24, 38, 42, 36, 58, 49, 65, 57, 72, 68, 81, 88].map((height, index) => (
              <i style={{ height: `${height}%` }} key={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
