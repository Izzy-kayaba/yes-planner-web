"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getBackend } from "@/lib/api/backend";
import type { EntityId, Pagination, WorkspaceModule } from "@/lib/api/contracts";

const PAGE_SIZE = 25;

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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>(() => ({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: demoMode ? seed.length : 0,
    totalPages: demoMode ? Math.ceil(seed.length / PAGE_SIZE) : 0,
    hasNextPage: demoMode && seed.length > PAGE_SIZE,
    hasPreviousPage: false,
  }));

  useEffect(() => {
    // Ignore results from an older request if the user changes wedding/module or leaves the page.
    let active = true;
    if (!resolvedWeddingId) {
      // Demo mode can supply a default wedding; API mode must wait for a real wedding ID.
      setLoading(false);
      return;
    }
    getBackend()
      .list(resolvedWeddingId, module, seed, page, PAGE_SIZE)
      .then((result) => {
        if (active) {
          setItems(result.items);
          setPagination(result.pagination);
        }
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        // Do not let a stale request change the loading state of the current view.
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [module, page, resolvedWeddingId]);

  const create = useCallback(
    async (value: Omit<T, "id">) => {
      const created = await getBackend().create<T>(resolvedWeddingId, module, value);
      // After adding an item, move to the last page so the newly appended row is visible.
      const firstPage = await getBackend().list(resolvedWeddingId, module, seed, 1, PAGE_SIZE);
      const targetPage = Math.max(1, firstPage.pagination.totalPages);
      const result =
        targetPage === 1
          ? firstPage
          : await getBackend().list(resolvedWeddingId, module, seed, targetPage, PAGE_SIZE);
      setPage(targetPage);
      setItems(result.items);
      setPagination(result.pagination);
      toast.success("Added successfully.");
      return created;
    },
    [module, resolvedWeddingId, seed],
  );

  const update = useCallback(
    async (value: T) => {
      const saved = await getBackend().update(resolvedWeddingId, module, value);
      const result = await getBackend().list(resolvedWeddingId, module, seed, page, PAGE_SIZE);
      setItems(result.items);
      setPagination(result.pagination);
      toast.success("Changes saved.");
      return saved;
    },
    [module, page, resolvedWeddingId, seed],
  );

  const remove = useCallback(
    async (id: EntityId) => {
      await getBackend().remove(resolvedWeddingId, module, id);
      // If the deleted item was the only row on this page, step back to a page that still exists.
      const targetPage = items.length === 1 && page > 1 ? page - 1 : page;
      if (targetPage !== page) setPage(targetPage);
      else {
        const result = await getBackend().list(resolvedWeddingId, module, seed, page, PAGE_SIZE);
        setItems(result.items);
        setPagination(result.pagination);
      }
      toast.success("Removed successfully.");
    },
    [items.length, module, page, resolvedWeddingId, seed],
  );

  return { items, loading, create, update, remove, setItems, page, setPage, pagination };
}
