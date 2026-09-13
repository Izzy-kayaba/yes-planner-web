import type { ReactNode } from "react";
import { WeddingNav } from "@/features/weddings/WeddingNav";
import { WeddingWorkspaceHeader } from "@/features/weddings/WeddingWorkspaceHeader";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  return (
    <div className="grid gap-5">
      <WeddingWorkspaceHeader />
      <WeddingNav weddingId={weddingId} />
      {children}
    </div>
  );
}
