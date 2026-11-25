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

export function MetricGridSkeleton({
  count = 4,
  items,
}: {
  count?: number;
  items?: Array<Pick<WeddingMetric, "label" | "value" | "detail">>;
}) {
  const skeletonItems =
    items ??
    Array.from({ length: count }, () => ({
      label: "Summary metric",
      value: "000",
      detail: "Additional information",
    }));

  return (
    <section
      className="stats-grid"
      role="status"
      aria-busy="true"
      aria-label="Loading summary metrics"
    >
      {skeletonItems.map((item, index) => (
        <article
          className="min-h-36 rounded-2xl border border-yes-line bg-yes-surface p-5 shadow-yes-soft max-sm:min-h-32 max-sm:p-4"
          key={index}
        >
          <div className="flex min-h-7 justify-between">
            <span className="skeleton-block size-7 rounded-lg" />
          </div>
          <p className="skeleton-block mb-1 mt-3 min-h-[18px] w-fit max-w-full text-[12px] text-transparent">
            {item.label}
          </p>
          <strong className="skeleton-block mb-0.5 block min-h-8 w-fit font-display text-2xl font-normal text-transparent">
            {item.value}
          </strong>
          <small className="skeleton-block min-h-4 w-fit max-w-full text-[11px] text-transparent">
            {item.detail}
          </small>
        </article>
      ))}
    </section>
  );
}
