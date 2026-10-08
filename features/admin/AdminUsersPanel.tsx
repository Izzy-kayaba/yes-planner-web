"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminSearch } from "@/features/admin/AdminSearch";
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
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("all");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(false);

  async function loadPage(
    page: number,
    overrides: { accountType?: string; sort?: string; search?: string } = {},
  ) {
    setLoading(true);
    try {
      const nextType = overrides.accountType ?? accountType;
      const nextSort = overrides.sort ?? sort;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        search: (overrides.search ?? search).trim(),
      });
      if (nextType !== "all") params.set("accountType", nextType);
      if (nextSort !== "default") params.set("sort", nextSort);
      const result = await apiRequest<PaginatedResult<AdminUser>>(`/api/v1/admin/users?${params}`, {
        cache: "no-store",
      });
      setUsers(result.items);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "User list could not be loaded."));
    } finally {
      setLoading(false);
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
      <AdminSearch
        value={search}
        onChange={setSearch}
        onSearch={() => void loadPage(1)}
        filters={[
          {
            label: "Account type",
            value: accountType,
            options: [
              { value: "all", label: text("All account types") },
              ...["Couple", "Vendor", "Venue", "Guest", "SystemAdmin"].map((value) => ({
                value,
                label: text(value),
              })),
            ],
            onChange: (value) => {
              setAccountType(value);
              void loadPage(1, { accountType: value });
            },
          },
        ]}
        sortLabel="Sort users"
        sortValue={sort}
        sortOptions={[
          { value: "default", label: text("Created (newest first)") },
          { value: "name", label: text("Name (A-Z)") },
          { value: "email", label: text("Email (A-Z)") },
        ]}
        onSortChange={(value) => {
          setSort(value);
          void loadPage(1, { sort: value });
        }}
        onClear={() => {
          setSearch("");
          setAccountType("all");
          setSort("default");
          void loadPage(1, { accountType: "all", sort: "default", search: "" });
        }}
      />
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
          <p className="text-sm text-yes-muted">
            {text(
              search || accountType !== "all"
                ? "No records match the current search or filters."
                : "No database users are available yet.",
            )}
          </p>
        )}
      </div>
      {loading && (
        <p aria-live="polite" className="mt-3 text-sm text-yes-muted">
          {text("Loading…")}
        </p>
      )}
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onChange={(page) => void loadPage(page)}
      />
    </article>
  );
}
