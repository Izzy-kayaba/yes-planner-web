"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getInitials } from "@/lib/initials";

const portfolios = [
  {
    studio: "Lumen & Lace",
    category: "Photography",
    detail: "Editorial light · Johannesburg",
    artwork: "from-[#3b2528] via-[#a46d70] to-[#e8c9bb]",
  },
  {
    studio: "Petal Theory",
    category: "Floral design",
    detail: "Season-led installations · Gauteng",
    artwork: "from-[#454b3f] via-[#819077] to-[#dec9b4]",
  },
  {
    studio: "Olive & Oak",
    category: "Catering",
    detail: "Modern South African menus",
    artwork: "from-[#50362a] via-[#a37b58] to-[#e8d8bd]",
  },
  {
    studio: "Afterglow Events",
    category: "Music & DJ",
    detail: "Curated dance floors · Nationwide",
    artwork: "from-[#29354a] via-[#6c7895] to-[#d5c6cd]",
  },
];

export function VendorPortfolioCarousel() {
  const [viewportRef, carousel] = useEmblaCarousel({ align: "start", dragFree: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);

  const updateSelection = useCallback(() => {
    if (!carousel) return;
    setSelectedIndex(carousel.selectedScrollSnap());
    setSlideCount(carousel.scrollSnapList().length);
  }, [carousel]);

  useEffect(() => {
    if (!carousel) return;
    updateSelection();
    carousel.on("select", updateSelection).on("reInit", updateSelection);
    return () => {
      carousel.off("select", updateSelection).off("reInit", updateSelection);
    };
  }, [carousel, updateSelection]);

  return (
    <section
      className="rounded-2xl border border-vow-line bg-vow-surface p-3 shadow-vow-soft sm:p-6"
      aria-labelledby="portfolio-heading"
    >
      <div className="mb-5 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Portfolio stories</p>
          <h2 id="portfolio-heading" className="text-[1.65rem] leading-tight sm:text-3xl">
            See the craft before you shortlist.
          </h2>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
          <span className="mr-1 text-[10px] font-bold text-vow-muted" aria-live="polite">
            {selectedIndex + 1} / {slideCount || 1}
          </span>
          <button
            className="icon-button"
            type="button"
            onClick={() => carousel?.scrollPrev()}
            aria-label="Previous portfolio"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => carousel?.scrollNext()}
            aria-label="Next portfolio"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={viewportRef}>
        <div className="flex touch-pan-y gap-3 sm:gap-4">
          {portfolios.map((portfolio) => (
            <article
              className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_46%] xl:flex-[0_0_31%]"
              key={portfolio.studio}
            >
              <div
                className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${portfolio.artwork}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,.55),transparent_18%),linear-gradient(to_top,rgba(27,18,19,.42),transparent_55%)]" />
                <span className="absolute bottom-4 left-4 font-display text-5xl text-white/80">
                  {getInitials(portfolio.studio)}
                </span>
                <button
                  className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-vow-wine shadow-vow-soft backdrop-blur"
                  type="button"
                  aria-label={`Save ${portfolio.studio}`}
                  onClick={() =>
                    setSaved((current) =>
                      current.includes(portfolio.studio)
                        ? current.filter((name) => name !== portfolio.studio)
                        : [...current, portfolio.studio],
                    )
                  }
                >
                  <Heart
                    size={17}
                    fill={saved.includes(portfolio.studio) ? "currentColor" : "none"}
                  />
                </button>
              </div>
              <div className="px-1 pt-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-vow-wine">
                  {portfolio.category}
                </p>
                <h3 className="mt-1 font-display text-xl">{portfolio.studio}</h3>
                <p className="mt-1 text-xs text-vow-muted">{portfolio.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
