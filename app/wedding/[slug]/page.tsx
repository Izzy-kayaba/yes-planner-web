import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicWeddingPage } from "@/features/public-wedding/PublicWeddingPage";
import { loadPublishedWedding } from "@/lib/wedding-publication";
import { mongoDb } from "@/lib/mongodb";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await loadPublishedWedding(slug);
  if (!wedding) return { title: "Wedding page" };
  return {
    title: wedding.displayName,
    description: wedding.story || `Join ${wedding.displayName} on their wedding day.`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicWeddingRoute({ params }: PageProps) {
  const { slug } = await params;
  const wedding = await loadPublishedWedding(slug);
  if (!wedding) notFound();
  const timeline = await mongoDb
    .collection("workspaceItems")
    .find<{ data?: Record<string, unknown> }>({
      ownerUserId: { $exists: true },
      weddingKey: wedding.weddingKey,
      module: "timeline",
      deletedAt: { $exists: false },
    })
    .sort({ createdAt: 1 })
    .toArray();
  return <PublicWeddingPage wedding={wedding} timeline={timeline} />;
}
