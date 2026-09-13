import { StatCard } from "@/components/ui/StatCard";

export interface WeddingMetric {
  label: string;
  value: string;
  detail: string;
  tone: string;
}

export function MetricGrid({ items }: { items: WeddingMetric[] }) {
  return (
    <section className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {items.map((item) => (
        <StatCard {...item} key={item.label} />
      ))}
    </section>
  );
}
