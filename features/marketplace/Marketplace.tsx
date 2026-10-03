"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { vendors } from "@/lib/demo-data";
import { VendorPortfolioCarousel } from "@/features/marketplace/VendorPortfolioCarousel";

const categories = ["All", "Photography", "Catering", "Florist", "Music & DJ"];

export function Marketplace() {
  const { text } = useLanguage();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [sort, setSort] = useState("Best match");
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("query") ?? "");
  }, []);
  const results = useMemo(() => {
    const filtered = vendors.filter(
      (vendor) =>
        (category === "All" || vendor.category === category) &&
        vendor.name.toLowerCase().includes(query.toLowerCase()),
    );
    return [...filtered].sort((a, b) =>
      sort === "Rating"
        ? Number(b.rating) - Number(a.rating)
        : sort === "Name"
          ? a.name.localeCompare(b.name)
          : 0,
    );
  }, [category, query, sort]);

  return (
    <div className="section-stack marketplace-page">
      <PageHeader
        eyebrow="Curated for your celebration"
        title="Find your creative team"
        description="Explore trusted wedding professionals whose work fits your date, place and style."
      />
      <section className="marketplace-search">
        <label>
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text("Search photographers, florists, venues…")}
          />
        </label>
        <button
          className="button button-primary"
          onClick={() => toast.success(`${results.length} ${text("matching vendors found.")}`)}
        >
          {text("Search vendors")}
        </button>
      </section>
      <div className="category-scroll">
        {categories.map((item) => (
          <button
            className={category === item ? "active" : ""}
            onClick={() => setCategory(item)}
            key={item}
          >
            {text(item)}
          </button>
        ))}
      </div>
      <section className="marketplace-feature">
        <div>
          <StatusPill tone="rose">Vow Planner edit</StatusPill>
          <h2>
            {text("Florals that feel")}
            <br />
            <em>{text("gathered, not arranged.")}</em>
          </h2>
          <p>
            {text("Meet five Johannesburg studios creating expressive, season-led celebrations.")}
          </p>
          <button className="button button-light" onClick={() => setCategory("Florist")}>
            {text("Explore the edit →")}
          </button>
        </div>
        <div className="editorial-flower">
          <span>✦</span>
          <i />
          <b />
        </div>
      </section>
      <VendorPortfolioCarousel />
      <div className="results-heading">
        <div>
          <p className="eyebrow">{text("Recommended near Johannesburg")}</p>
          <h3>
            {results.length} {text("exceptional matches")}
          </h3>
        </div>
        <select
          className="button button-secondary"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label={text("Sort vendors")}
        >
          <option value="Best match">{text("Best match")}</option>
          <option value="Rating">{text("Rating")}</option>
          <option value="Name">{text("Name")}</option>
        </select>
      </div>
      <section className="vendor-grid marketplace-grid">
        {results.map((vendor, index) => (
          <article className="vendor-card" key={vendor.name}>
            <div className={`vendor-cover tall tone-${vendor.tone}`}>
              <span>{vendor.initials}</span>
              <button
                className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-vow-wine shadow-vow-soft backdrop-blur"
                type="button"
                aria-label={`${text("Save")} ${vendor.name}`}
                onClick={() =>
                  setSaved((current) =>
                    current.includes(vendor.name)
                      ? current.filter((name) => name !== vendor.name)
                      : [...current, vendor.name],
                  )
                }
              >
                <Heart size={17} fill={saved.includes(vendor.name) ? "currentColor" : "none"} />
              </button>
              <small>{text("View portfolio")}</small>
            </div>
            <div className="vendor-card-copy">
              <div>
                <p>{text(vendor.category)}</p>
                <span className="rating">★ {vendor.rating}</span>
              </div>
              <h3>{vendor.name}</h3>
              <p>{text("Johannesburg · Responds within a day")}</p>
              <strong>{text(vendor.price)}</strong>
              <button
                className="button button-secondary button-wide"
                onClick={() => toast.info(`${vendor.name} ${text("profile preview opened.")}`)}
              >
                {text("View profile")}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
