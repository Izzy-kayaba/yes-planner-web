"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getBackend } from "@/lib/api/backend";
import type { EntityId, WorkspaceModule } from "@/lib/api/contracts";

export function useWorkspaceCollection<T extends { id: EntityId }>(
  module: WorkspaceModule,
  seed: T[],
  weddingId = "amara-sipho",
) {
  const [items, setItems] = useState(seed);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getBackend()
      .list(weddingId, module, seed)
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
  }, [module, weddingId]);

  const create = useCallback(
    async (value: Omit<T, "id">) => {
      const created = await getBackend().create<T>(weddingId, module, value);
      setItems((current) => [...current, created]);
      toast.success("Added successfully.");
      return created;
    },
    [module, weddingId],
  );

  const update = useCallback(
    async (value: T) => {
      const saved = await getBackend().update(weddingId, module, value);
      setItems((current) =>
        current.map((item) => (String(item.id) === String(saved.id) ? saved : item)),
      );
      toast.success("Changes saved.");
      return saved;
    },
    [module, weddingId],
  );

  const remove = useCallback(
    async (id: EntityId) => {
      await getBackend().remove(weddingId, module, id);
      setItems((current) => current.filter((item) => String(item.id) !== String(id)));
      toast.success("Removed successfully.");
    },
    [module, weddingId],
  );

  return { items, loading, create, update, remove, setItems };
}
