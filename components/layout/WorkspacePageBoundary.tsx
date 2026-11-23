"use client";

// Purpose: keeps protected workspace navigation responsive while route content resolves.
import { Suspense, type ReactNode } from "react";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";

export function WorkspacePageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<WorkspaceSkeleton />}>{children}</Suspense>;
}
