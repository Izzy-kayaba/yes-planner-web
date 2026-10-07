"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { getInitials } from "@/lib/initials";
import { YesSelect } from "@/components/ui/YesSelect";
import { inferMoneyRange, vendorPriceRanges } from "@/lib/estimate-ranges";
import { LIST_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { countryOptions } from "@/lib/countries";

export type MarketplaceVendor = {
  id: string;
  businessName: string;
  services: string[];
  serviceArea: string;
  countryCode: string;
  startingPriceMinor: number;
  startingPriceRangeKey?: string;
  profileImage: string;
};

export function LiveMarketplace({ vendors }: { vendors: MarketplaceVendor[] }) {
  const { language, text } = useLanguage();
  const { displayMoney } = useCurrency();
  const [query, setQuery] = useState("");
  const [service, setService] = useState("All");
  const [priceRange, setPriceRange] = useState("All");
  const [country, setCountry] = useState("All");
  const [page, setPage] = useState(1);
  const services = useMemo(
    () => ["All", ...Array.from(new Set(vendors.flatMap((vendor) => vendor.services))).sort()],
    [vendors],
  );
  const results = vendors.filter(
    (vendor) =>
      (service === "All" || vendor.services.includes(service)) &&
      (country === "All" || vendor.countryCode === country) &&
      (priceRange === "All" ||
        (vendor.startingPriceRangeKey ||
          inferMoneyRange(vendorPriceRanges, vendor.startingPriceMinor)) === priceRange) &&
      `${vendor.businessName} ${vendor.serviceArea} ${vendor.services.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(results.length / LIST_PAGE_SIZE)));
  const visibleResults = results.slice(
    (currentPage - 1) * LIST_PAGE_SIZE,
    currentPage * LIST_PAGE_SIZE,
  );

  function priceLabel(vendor: MarketplaceVendor) {
    const range = vendorPriceRanges.find(
      (item) =>
        item.id ===
        (vendor.startingPriceRangeKey ||
          inferMoneyRange(vendorPriceRanges, vendor.startingPriceMinor)),
    );
    if (!range) return text("Quote required");
    return range.maxMinor === null
      ? `${displayMoney(range.minMinor)}+`
      : `${displayMoney(range.minMinor)} – ${displayMoney(range.maxMinor)}`;
  }

  return (
    <div className="section-stack marketplace-page">
      <PageHeader
        eyebrow={text("Vendor marketplace")}
        title={text("Find your creative team")}
        description={text(
          "Browse real vendor profiles, portfolios and services, then send a work request.",
        )}
      />
      <section className="marketplace-search">
        <label>
          <Search size={16} />
          <input
            id="marketplace-search"
            name="marketplaceSearch"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text("Search vendors")}
            value={query}
          />
        </label>
        <YesSelect
          ariaLabel={text("Price range")}
          id="marketplace-price-range"
          name="priceRange"
          onChange={setPriceRange}
          options={[
            { value: "All", label: text("All prices") },
            ...vendorPriceRanges.map((range) => ({
              value: range.id,
              label:
                range.maxMinor === null
                  ? `${displayMoney(range.minMinor)}+`
                  : `${displayMoney(range.minMinor)} – ${displayMoney(range.maxMinor)}`,
            })),
          ]}
          value={priceRange}
        />
        <YesSelect
          ariaLabel={text("Country")}
          id="marketplace-country"
          name="country"
          onChange={setCountry}
          options={[
            { value: "All", label: text("All countries") },
            ...countryOptions(language).filter((option) =>
              vendors.some((vendor) => vendor.countryCode === option.value),
            ),
          ]}
          value={country}
        />
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
          {visibleResults.map((vendor) => (
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
                <strong>{priceLabel(vendor)}</strong>
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
        <section className="panel text-center text-yes-muted">
          {text("No vendor profiles match this search yet.")}
        </section>
      )}
      <Pagination page={currentPage} total={results.length} onChange={setPage} />
    </div>
  );
}
