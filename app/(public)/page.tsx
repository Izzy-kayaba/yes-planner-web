import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { getTextTranslator } from "@/lib/i18n-server";
import Image from "next/image";
import { CoupleTestimonials } from "@/features/public/CoupleTestimonials";
import { DisplayMoney } from "@/components/currency/DisplayMoney";
import { getAuthorizedSession } from "@/lib/auth/session";

const features = [
  {
    number: "01",
    title: "One calm command centre",
    body: "Budget, guests, tasks, vendors and your wedding-day timeline stay beautifully in sync.",
    image: "/assets/home-carrd-1.jpeg",
  },
  {
    number: "02",
    title: "Plan with your people",
    body: "Couples and assigned planners work from the same live plan, with ownership safely protected.",
    image: "/assets/home-card-2.jpeg",
  },
  {
    number: "03",
    title: "Find exceptional vendors",
    body: "Discover trusted creative partners, compare packages and manage every booking in context.",
    image: "/assets/home-card-3.jpeg",
  },
];

export default async function HomePage() {
  if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") !== "demo") {
    const session = await getAuthorizedSession();
    if (session) {
      redirect(
        session.user.role === "Vendor"
          ? "/vendor"
          : session.user.role === "Planner"
            ? "/planner"
            : session.user.role === "SystemAdmin"
              ? "/admin"
              : "/dashboard",
      );
    }
  }
  const text = await getTextTranslator();

  return (
    <main className="landing">
      <nav className="landing-nav page-width">
        <Brand />
        <div className="landing-links">
          <a href="#experience">{text("Experience")}</a>
          <a href="#professionals">{text("For professionals")}</a>
          <a href="#stories">{text("Stories")}</a>
        </div>
        <div className="landing-actions">
          <Link className="text-link" href="/login">
            {text("Sign in")}
          </Link>
          <Link className="button button-primary text-center" href="/register">
            {text("Start planning")}
          </Link>
        </div>
      </nav>

      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">{text("Wedding planning, reimagined")}</p>
          <h1>
            {text("Your forever begins with a plan that feels")} <em>{text("effortless.")}</em>
          </h1>
          <p className="hero-lead">
            {text(
              "One considered space for your guests, budget, vendors and every beautiful detail in between.",
            )}
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/register">
              {text("Plan your wedding")} <span>→</span>
            </Link>
            <Link className="button button-ghost button-large" href="/dashboard">
              <span className="play">▶</span> {text("Explore the workspace")}
            </Link>
          </div>
          <div className="trust-row">
            <div className="avatar-stack">
              <span>TM</span>
              <span>AN</span>
              <span>SK</span>
              <span>+</span>
            </div>
            <div>
              <strong>{text("Loved by modern couples")}</strong>
              <span>{text("4.9 average planning experience")}</span>
            </div>
          </div>
        </div>

        <div
          className="hero-visual"
          aria-label={text("Preview of the Yes Planner wedding planning experience")}
        >
          <div className="hero-halo" />
          <div className="hero-photo">
            <div className="floral floral-left">✦</div>
            <Image
              className="hero-img"
              src="/assets/hero-image.jpeg"
              alt="Engaged couple celebrating together"
              width={600}
              height={900}
              priority
            />
          </div>

          <div className="floating-card floating-budget">
            <div className="floating-icon">↗</div>
            <div>
              <span>{text("Budget on track")}</span>
              <strong>
                <DisplayMoney amountMinor={1_007_000} />
              </strong>
              <small>{text("remaining")}</small>
            </div>
          </div>

          <div className="floating-card floating-guests">
            <div className="progress-orb">72%</div>
            <div>
              <span>{text("Guest responses")}</span>
              <strong>{text("118 attending")}</strong>
              <small>{text("46 awaiting reply")}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="partner-strip">
        <p>{text("Everything your celebration needs, in one considered place")}</p>
        <div>
          <span>
            VOGUE
            <br />
            <small>WEDDINGS</small>
          </span>
          <span>
            WEDDING
            <br />
            <small>CONCEPTS</small>
          </span>
          <span>THE KNOT</span>
          <span>BRIDES</span>
        </div>
      </section>

      <section className="experience page-width" id="experience">
        <div className="section-heading">
          <p className="eyebrow">{text("Beautifully organised")}</p>
          <h2>
            {text("Less managing.")}
            <br />
            <em>{text("More meaning.")}</em>
          </h2>
          <p>
            {text(
              "Thoughtful tools bring clarity to every phase, from the first shared idea to the last dance.",
            )}
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span>{feature.number}</span>
              <div className="feature-art">
                <Image fill sizes="(max-width: 760px) 100vw, 33vw" src={feature.image} alt="" />
              </div>
              <h3>{text(feature.title)}</h3>
              <p>{text(feature.body)}</p>
              <Link href="/register">{text("Discover more →")}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="professional-band" id="professionals">
        <div className="page-width professional-inner">
          <div>
            <p className="eyebrow light">{text("For wedding professionals")}</p>
            <h2>
              {text("Run the business.")}
              <br />
              {text("Keep the magic.")}
            </h2>
            <p>
              {text(
                "Manage clients, teams, bookings and finances without losing the personal touch that sets your work apart.",
              )}
            </p>
            <Link className="button button-light" href="/register">
              {text("Explore professional tools →")}
            </Link>
          </div>
          <div className="professional-preview">
            <div className="preview-window">
              <div className="preview-top">
                <span />
                <span />
                <span />
              </div>
              <p>{text("October portfolio")}</p>
              <strong>{text("6 active weddings")}</strong>
              {[76, 52, 88].map((value, index) => (
                <div className="preview-row" key={value}>
                  <i>{["AM", "JL", "NS"][index]}</i>
                  <span>
                    <b style={{ width: `${value}%` }} />
                  </span>
                  <small>{value}%</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CoupleTestimonials />

      <footer className="landing-footer page-width">
        <Brand />
        <p>{text("Planning made personal, from yes to I do.")}</p>
        <span>© 2026 Yes Planner</span>
      </footer>
    </main>
  );
}
