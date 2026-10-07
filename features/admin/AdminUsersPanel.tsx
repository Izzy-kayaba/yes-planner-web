"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult, Pagination as PaginationMetadata } from "@/lib/api/contracts";
import { getInitials } from "@/lib/initials";
import { toast } from "sonner";

type AdminUser = { id: string; name: string; email: string; role: string };

export function AdminUsersPanel({
  initialUsers,
  initialPagination,
}: {
  initialUsers: AdminUser[];
  initialPagination: PaginationMetadata;
}) {
  const { text } = useLanguage();
  const [users, setUsers] = useState(initialUsers);
  const [pagination, setPagination] = useState(initialPagination);

  async function loadPage(page: number) {
    try {
      const result = await apiRequest<PaginatedResult<AdminUser>>(
        `/api/v1/admin/users?page=${page}&pageSize=${pagination.pageSize}`,
        { cache: "no-store" },
      );
      setUsers(result.items);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "User list could not be loaded."));
    }
  }

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{text("User access")}</p>
          <h3>{text("Recent accounts")}</h3>
        </div>
        <StatusPill tone="sage">{text("Server protected")}</StatusPill>
      </div>
      <div className="request-list">
        {users.length ? (
          users.map((user) => (
            <div key={user.id}>
              <span className="avatar">{getInitials(user.name)}</span>
              <p>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </p>
              <StatusPill tone={user.role === "SystemAdmin" ? "rose" : "neutral"}>
                {user.role}
              </StatusPill>
            </div>
          ))
        ) : (
          <p className="text-sm text-yes-muted">{text("No database users are available yet.")}</p>
        )}
      </div>
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onChange={(page) => void loadPage(page)}
      />
    </article>
  );
}
