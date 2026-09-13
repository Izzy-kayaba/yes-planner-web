import dynamic from "next/dynamic";
import { MetricGrid } from "@/features/weddings/MetricGrid";

const WeddingAnalytics = dynamic(
  () => import("@/features/reports/WeddingAnalytics").then((module) => module.WeddingAnalytics),
  {
    loading: () => (
      <div className="panel min-h-72 animate-pulse" aria-label="Loading wedding analytics" />
    ),
  },
);

export function ReportsSection() {
  return (
    <>
      <MetricGrid
        items={[
          { label: "Planning readiness", value: "68%", detail: "+12% this month", tone: "rose" },
          { label: "Budget health", value: "Healthy", detail: "35% remains", tone: "sage" },
          { label: "RSVP rate", value: "76%", detail: "+18 replies this week", tone: "gold" },
          { label: "Task velocity", value: "8 / week", detail: "Ahead of schedule", tone: "blue" },
        ]}
      />
      <WeddingAnalytics />
    </>
  );
}
