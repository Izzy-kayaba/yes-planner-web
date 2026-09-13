import Link from "next/link";
import { Brand } from "@/components/ui/Brand";

const features = [
  {
    number: "01",
    title: "One calm command centre",
    body: "Budget, guests, tasks, vendors and your wedding-day timeline stay beautifully in sync.",
  },
  {
    number: "02",
    title: "Plan with your people",
    body: "Couples and assigned planners work from the same live plan, with ownership safely protected.",
  },
  {
    number: "03",
    title: "Find exceptional vendors",
    body: "Discover trusted creative partners, compare packages and manage every booking in context.",
  },
];

export default function HomePage() {
  return (
    <main className="landing">
      <nav className="landing-nav page-width">
        <Brand />
        <div className="landing-links">
          <a href="#experience">Experience</a>
          <a href="#professionals">For professionals</a>
          <a href="#stories">Stories</a>
        </div>
        <div className="landing-actions">
          <Link className="text-link" href="/login">
            Sign in
          </Link>
          <Link className="button button-primary" href="/register">
            Start planning
          </Link>
        </div>
      </nav>

      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">Wedding planning, reimagined</p>
          <h1>
            Your forever begins with a plan that feels <em>effortless.</em>
          </h1>
          <p className="hero-lead">
            One considered space for your guests, budget, vendors and every beautiful detail in
            between.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/register">
              Plan your wedding <span>→</span>
            </Link>
            <Link className="button button-ghost button-large" href="/dashboard">
              <span className="play">▶</span> Explore the workspace
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
              <strong>Loved by modern couples</strong>
              <span>4.9 average planning experience</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Preview of the Vow Planner wedding dashboard">
          <div className="hero-halo" />
          <div className="hero-photo">
            <div className="floral floral-left">✦</div>
            <div className="couple-silhouette">
              <span />
              <i />
            </div>
            <div className="photo-caption">
              <span>18 · 10 · 26</span>
              <strong>Amara & Sipho</strong>
              <small>Johannesburg</small>
            </div>
          </div>
          <div className="floating-card floating-budget">
            <div className="floating-icon">↗</div>
            <div>
              <span>Budget on track</span>
              <strong>R 184,500</strong>
              <small>remaining</small>
            </div>
          </div>
          <div className="floating-card floating-guests">
            <div className="progress-orb">72%</div>
            <div>
              <span>Guest responses</span>
              <strong>118 attending</strong>
              <small>46 awaiting reply</small>
            </div>
          </div>
        </div>
      </section>

      <section className="partner-strip">
        <p>Everything your celebration needs, in one considered place</p>
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
          <p className="eyebrow">Beautifully organised</p>
          <h2>
            Less managing.
            <br />
            <em>More meaning.</em>
          </h2>
          <p>
            Thoughtful tools bring clarity to every phase, from the first shared idea to the last
            dance.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span>{feature.number}</span>
              <div className="feature-art" aria-hidden="true">
                <i />
                <b />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <Link href="/register">Discover more →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="professional-band" id="professionals">
        <div className="page-width professional-inner">
          <div>
            <p className="eyebrow light">For wedding professionals</p>
            <h2>
              Run the business.
              <br />
              Keep the magic.
            </h2>
            <p>
              Manage clients, teams, bookings and finances without losing the personal touch that
              sets your work apart.
            </p>
            <Link className="button button-light" href="/register">
              Explore professional tools →
            </Link>
          </div>
          <div className="professional-preview">
            <div className="preview-window">
              <div className="preview-top">
                <span />
                <span />
                <span />
              </div>
              <p>October portfolio</p>
              <strong>6 active weddings</strong>
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

      <section className="story-section page-width" id="stories">
        <p className="story-mark">“</p>
        <blockquote>
          We stopped feeling like project managers and started enjoying our engagement again.
        </blockquote>
        <p>Thandi & Michael · Married in Cape Town</p>
        <Link className="button button-primary" href="/register">
          Begin your story
        </Link>
      </section>

      <footer className="landing-footer page-width">
        <Brand />
        <p>Planning made personal, from yes to I do.</p>
        <span>© 2026 Vow Planner</span>
      </footer>
    </main>
  );
}
