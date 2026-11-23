// Purpose: implements features/weddings/MetricGrid.tsx for the Yes Planner web application.
import { StatCard } from "@/components/ui/StatCard";

export interface WeddingMetric {
  label: string;
  value: string;
  detail: string;
  tone: string;
}

export function MetricGrid({ items }: { items: WeddingMetric[] }) {
  return (
    <section className="stats-grid">
      {items.map((item) => (
        <StatCard {...item} key={item.label} />
      ))}
    </section>
  );
}

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section
      className="stats-grid"
      role="status"
      aria-busy="true"
      aria-label="Loading summary metrics"
    >
      {Array.from({ length: count }, (_, index) => (
        <article
          className="min-h-36 rounded-2xl border border-yes-line bg-yes-surface p-5 shadow-yes-soft max-sm:min-h-32 max-sm:p-4"
          key={index}
        >
          <div className="flex min-h-7 justify-between">
            <span className="skeleton-block size-7 rounded-lg" />
          </div>
          <span className="skeleton-block mb-2 mt-3 h-3 w-24" />
          <span className="skeleton-block mb-1 h-8 w-24" />
          <span className="skeleton-block h-3 w-36 max-w-full" />
        </article>
      ))}
    </section>
  );
}
