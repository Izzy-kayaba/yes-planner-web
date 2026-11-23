"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";
import { WeddingPublicationBuilder } from "@/features/weddings/WeddingPublicationBuilder";
import type { WeddingPublication } from "@/lib/wedding-publication";

export function WeddingPublicationSection() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const [publication, setPublication] = useState<WeddingPublication | null>(null);
  useEffect(() => {
    void apiRequest<WeddingPublication>(
      `/api/v1/weddings/${encodeURIComponent(weddingId)}/publication`,
    )
      .then(setPublication)
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "The wedding website could not be loaded.",
        ),
      );
  }, [weddingId]);
  return publication ? (
    <WeddingPublicationBuilder initial={publication} />
  ) : (
    <WorkspaceSkeleton variant="publication" label="Loading wedding website" />
  );
}
