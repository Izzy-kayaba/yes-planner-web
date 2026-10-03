"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { getInitials } from "@/lib/initials";

export type MarketplaceVendor = {
  id: string;
  businessName: string;
  services: string[];
  serviceArea: string;
  startingPriceMinor: number;
  profileImage: string;
};

export function LiveMarketplace({ vendors }: { vendors: MarketplaceVendor[] }) {
  const { text } = useLanguage();
  const { displayMoney } = useCurrency();
  const [query, setQuery] = useState("");
  const [service, setService] = useState("All");
  const services = useMemo(
    () => ["All", ...Array.from(new Set(vendors.flatMap((vendor) => vendor.services))).sort()],
    [vendors],
  );
  const results = vendors.filter(
    (vendor) =>
      (service === "All" || vendor.services.includes(service)) &&
      `${vendor.businessName} ${vendor.serviceArea} ${vendor.services.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <div className="section-stack marketplace-page">
      <PageHeader
        eyebrow="Vendor marketplace"
        title="Find your creative team"
        description="Browse real vendor profiles, portfolios and services, then send a work request."
      />
      <section className="marketplace-search">
        <label>
          <Search size={16} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text("Search vendors")}
            value={query}
          />
        </label>
      </section>
      <div className="category-scroll">
        {services.map((item) => (
          <button
            className={service === item ? "active" : ""}
            key={item}
            onClick={() => setService(item)}
          >
            {text(item)}
          </button>
        ))}
      </div>
      {results.length ? (
        <section className="vendor-grid marketplace-grid">
          {results.map((vendor) => (
            <article className="vendor-card" key={vendor.id}>
              <div
                className={`vendor-cover tall tone-rose${vendor.profileImage ? " has-image" : ""}`}
              >
                {vendor.profileImage ? (
                  <Image
                    alt={`${vendor.businessName} profile`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    src={vendor.profileImage}
                    unoptimized
                  />
                ) : (
                  <span>{getInitials(vendor.businessName)}</span>
                )}
              </div>
              <div className="vendor-card-copy">
                <p>{vendor.services.map(text).join(" · ")}</p>
                <h3>{vendor.businessName}</h3>
                <p>{vendor.serviceArea}</p>
                <strong>
                  {vendor.startingPriceMinor
                    ? `${text("From")} ${displayMoney(vendor.startingPriceMinor)}`
                    : text("Quote required")}
                </strong>
                <Link
                  className="button button-secondary button-wide"
                  href={`/marketplace/${encodeURIComponent(vendor.id)}`}
                >
                  {text("View profile")}
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="panel text-center text-vow-muted">
          {text("No vendor profiles match this search yet.")}
        </section>
      )}
    </div>
  );
}
