"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api/client";

export type ConnectedVendor = { id: string; name: string; services: string[] };

export function useConnectedVendors() {
  const params = useParams<{ weddingId?: string }>();
  const [vendors, setVendors] = useState<ConnectedVendor[]>([]);
  useEffect(() => {
    // Demo mode uses local sample data, and requests need a real wedding key in API mode.
    if (!params.weddingId || (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api") === "demo") return;
    // Prevent an older wedding's response from replacing the current wedding's vendor list.
    let active = true;
    apiRequest<ConnectedVendor[]>(
      `/api/v1/connected-vendors?weddingKey=${encodeURIComponent(params.weddingId)}`,
    ).then((result) => {
      if (active) setVendors(result);
    });
    return () => {
      active = false;
    };
  }, [params.weddingId]);
  return vendors;
}
