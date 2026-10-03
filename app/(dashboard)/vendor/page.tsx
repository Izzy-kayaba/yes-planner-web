import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { getTextTranslator } from "@/lib/i18n-server";
import { requirePageRole } from "@/lib/auth/session";
import { mongoDb } from "@/lib/mongodb";
import { VendorWorkspace, type VendorRequestValue } from "@/features/vendors/VendorWorkspace";

export async function generateMetadata(): Promise<Metadata> {
  const text = await getTextTranslator();
  return { title: text("Vendor portal") };
}

export default async function VendorPage() {
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  if (!demoMode) {
    const session = await requirePageRole(["Vendor"]);
    const [profile, requests] = await Promise.all([
      mongoDb.collection("vendorProfiles").findOne({ ownerUserId: session.user.id }),
      mongoDb
        .collection("vendorRequests")
        .find({ vendorUserId: session.user.id })
        .sort({ createdAt: -1 })
        .toArray(),
    ]);
    if (!profile) redirect("/onboarding");
    return (
      <VendorWorkspace
        businessName={String(profile.businessName)}
        contactName={String(profile.contactName)}
        portfolioCount={Array.isArray(profile.portfolioImages) ? profile.portfolioImages.length : 0}
        services={Array.isArray(profile.services) ? profile.services.map(String) : []}
        requests={requests.map((request) => ({
          id: String(request._id),
          coupleName: String(request.coupleName ?? ""),
          weddingDate: String(request.weddingDate ?? ""),
          venue: String(request.venue ?? ""),
          location: String(request.location ?? ""),
          service: String(request.service ?? ""),
          message: String(request.message ?? ""),
          status: String(request.status ?? "Pending") as VendorRequestValue["status"],
          weddingKey: String(request.weddingKey ?? ""),
        }))}
      />
    );
  }
  const text = await getTextTranslator();

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Lumen & Lace Studio"
        title="Good morning, Zoë"
        description="Your bookings, enquiries and client moments for the week."
        action={
          <Link className="button button-primary" href="/settings">
            {text("Edit public profile")}
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
              <p className="eyebrow">{text("Booking requests")}</p>
              <h3>{text("Ready for your response")}</h3>
            </div>
            <Link className="button button-secondary" href="/marketplace">
              {text("View marketplace")}
            </Link>
          </div>
          <div className="request-list">
            <div>
              <span className="avatar">KN</span>
              <p>
                <strong>Karabo & Neo</strong>
                <small>{text("21 March 2027 · Full-day photography")}</small>
              </p>
              <StatusPill tone="gold">New</StatusPill>
            </div>
            <div>
              <span className="avatar">NS</span>
              <p>
                <strong>Nandi & Sam</strong>
                <small>{text("13 December 2026 · Photo + film")}</small>
              </p>
              <StatusPill tone="rose">Follow up</StatusPill>
            </div>
            <div>
              <span className="avatar">JL</span>
              <p>
                <strong>Jessica & Liam</strong>
                <small>{text("07 November 2026 · Album add-on")}</small>
              </p>
              <StatusPill tone="neutral">Quote sent</StatusPill>
            </div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{text("Next booking")}</p>
              <h3>Ruth & Izzy</h3>
            </div>
            <StatusPill tone="sage">Confirmed</StatusPill>
          </div>
          <div className="next-booking">
            <strong>18</strong>
            <span>
              {text("OCT")}
              <br />
              2026
            </span>
            <div>
              <p>Shepstone Gardens</p>
              <small>{text("Johannesburg · 12:30 arrival")}</small>
            </div>
          </div>
          <div className="booking-checklist">
            <span>
              <i>✓</i>
              {text("Contract signed")}
            </span>
            <span>
              <i>✓</i>
              {text("Deposit received")}
            </span>
            <span>
              <i>○</i>
              {text("Final timeline approval")}
            </span>
          </div>
          <Link className="button button-secondary button-wide" href="/weddings/ruth-izzy">
            {text("Open wedding brief")}
          </Link>
        </article>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Performance")}</p>
            <h3>{text("Enquiries to confirmed bookings")}</h3>
          </div>
          <select className="button button-secondary" aria-label={text("Performance period")}>
            <option>{text("Last 6 months")}</option>
            <option>{text("Last 12 months")}</option>
            <option>{text("This year")}</option>
          </select>
        </div>
        <div className="performance-layout">
          <div className="conversion-ring">
            <span>
              <b>64%</b>
              {text("conversion")}
            </span>
          </div>
          <div className="performance-stats">
            <div>
              <span>{text("Average response")}</span>
              <strong>2h 18m</strong>
            </div>
            <div>
              <span>{text("Profile views")}</span>
              <strong>1,284</strong>
            </div>
            <div>
              <span>{text("Package saves")}</span>
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
