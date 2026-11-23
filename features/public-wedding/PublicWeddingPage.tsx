import Link from "next/link";
import type { WeddingPhoto, WeddingPublication } from "@/lib/wedding-publication";
import { PublicWeddingCountdown } from "@/features/public-wedding/PublicWeddingCountdown";

type PublicItem = { data?: Record<string, unknown> };

export function PublicWeddingPage({
  wedding,
  timeline,
}: {
  wedding: WeddingPublication;
  timeline: PublicItem[];
}) {
  const cover = wedding.photos.find((photo) => photo.isCover) ?? wedding.photos[0];
  const gallery = wedding.photos.filter((photo) => photo.id !== cover?.id);
  const mapQuery = wedding.venueAddress || wedding.venue || "South Africa";
  return (
    <main className={`public-wedding public-wedding-${wedding.theme}`}>
      <section className="public-wedding-hero public-wedding-hero-editorial">
        <div className="public-wedding-hero-copy">
          <p className="public-wedding-kicker">You’re invited</p>
          <h1>{wedding.displayName}</h1>
          <p className="public-wedding-date">{formatWeddingDate(wedding.weddingDate)}</p>
          {wedding.hashtag ? <p className="public-wedding-hashtag">{wedding.hashtag}</p> : null}
          <a className="public-wedding-scroll-cue" href="#the-day">
            Discover the details <span aria-hidden="true">↓</span>
          </a>
          <PublicWeddingCountdown weddingDate={wedding.weddingDate} />
        </div>
        {cover ? (
          <img className="public-wedding-cover" src={cover.url} alt={cover.alt} />
        ) : (
          <div className="public-wedding-cover-placeholder" aria-hidden="true">
            <span>{wedding.displayName}</span>
            <small>Our day is almost here</small>
          </div>
        )}
      </section>

      <div className="public-wedding-content">
        <section className="public-wedding-section public-wedding-story">
          <p className="public-wedding-label">{wedding.story ? "Our story" : "Welcome"}</p>
          <h2>
            {wedding.story
              ? `With love, from ${wedding.partnerName || "the couple"}`
              : "We cannot wait to celebrate with you."}
          </h2>
          <p>
            {wedding.story ||
              `Join ${wedding.displayName} for a beautiful day filled with love, laughter and memories.`}
          </p>
        </section>
        {gallery.length ? (
          <section className="public-wedding-section">
            <p className="public-wedding-label">The two of us</p>
            <div className="public-wedding-gallery">
              {gallery.map((photo) => (
                <img key={photo.id} src={photo.url} alt={photo.alt} loading="lazy" />
              ))}
            </div>
          </section>
        ) : null}
        <section className="public-wedding-section public-wedding-details" id="the-day">
          <div>
            <p className="public-wedding-label">The day</p>
            <h2>{formatWeddingDate(wedding.weddingDate)}</h2>
            <p>{wedding.venue || "Details coming soon"}</p>
            <p>{wedding.venueAddress}</p>
            {wedding.directionsUrl ? (
              <a
                className="public-wedding-button"
                href={wedding.directionsUrl}
                rel="noreferrer"
                target="_blank"
              >
                Get directions
              </a>
            ) : null}
          </div>
          <div className="public-wedding-map">
            <iframe
              title={`Map showing ${mapQuery}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            />
          </div>
        </section>
        {timeline.length ? (
          <section className="public-wedding-section">
            <p className="public-wedding-label">The programme</p>
            <div className="public-wedding-list">
              {timeline.map((item, index) => (
                <div key={`${index}-${String(item.data?.name ?? item.data?.title ?? "event")}`}>
                  <strong>{String(item.data?.time ?? "")}</strong>
                  <span>{String(item.data?.name ?? item.data?.title ?? "Wedding moment")}</span>
                  <small>{String(item.data?.location ?? item.data?.description ?? "")}</small>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <section className="public-wedding-rsvp">
          <p className="public-wedding-label">We hope to see you</p>
          <h2>Can’t wait to celebrate together.</h2>
          <p>Have a personal invitation? Open the secure RSVP link sent to you by the couple.</p>
        </section>
      </div>
      <footer className="public-wedding-footer">
        Made with <Link href="/">Yes Planner</Link>
      </footer>
    </main>
  );
}

function formatWeddingDate(value: string) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}
