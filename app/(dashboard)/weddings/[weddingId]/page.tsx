import type { Metadata } from "next";
import { WeddingOverview } from "@/features/weddings/WeddingOverview";

export const metadata: Metadata = { title: "Wedding overview" };

export default function WeddingPage() {
  return <WeddingOverview />;
}
