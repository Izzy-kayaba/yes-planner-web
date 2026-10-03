"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getBackend } from "@/lib/api/backend";
import type { EntityId, WorkspaceModule } from "@/lib/api/contracts";

export function useWorkspaceCollection<T extends { id: EntityId }>(
  module: WorkspaceModule,
  seed: T[],
  weddingId?: string,
) {
  const params = useParams<{ weddingId?: string }>();
  const demoMode = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo";
  const resolvedWeddingId = weddingId ?? params.weddingId ?? (demoMode ? "ruth-izzy" : "");
  const [items, setItems] = useState<T[]>(() => (demoMode ? seed : []));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!resolvedWeddingId) {
      setLoading(false);
      return;
    }
    getBackend()
      .list(resolvedWeddingId, module, seed)
      .then((values) => {
        if (active) setItems(values);
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [module, resolvedWeddingId]);

  const create = useCallback(
    async (value: Omit<T, "id">) => {
      const created = await getBackend().create<T>(resolvedWeddingId, module, value);
      setItems((current) => [...current, created]);
      toast.success("Added successfully.");
      return created;
    },
    [module, resolvedWeddingId],
  );

  const update = useCallback(
    async (value: T) => {
      const saved = await getBackend().update(resolvedWeddingId, module, value);
      setItems((current) =>
        current.map((item) => (String(item.id) === String(saved.id) ? saved : item)),
      );
      toast.success("Changes saved.");
      return saved;
    },
    [module, resolvedWeddingId],
  );

  const remove = useCallback(
    async (id: EntityId) => {
      await getBackend().remove(resolvedWeddingId, module, id);
      setItems((current) => current.filter((item) => String(item.id) !== String(id)));
      toast.success("Removed successfully.");
    },
    [module, resolvedWeddingId],
  );

  return { items, loading, create, update, remove, setItems };
}
