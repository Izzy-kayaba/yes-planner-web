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
