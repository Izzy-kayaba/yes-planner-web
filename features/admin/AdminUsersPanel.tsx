"use client";
// Purpose: implements features/admin/AdminUsersPanel.tsx for the Yes Planner web application.

import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminSearch } from "@/features/admin/AdminSearch";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult, Pagination as PaginationMetadata } from "@/lib/api/contracts";
import { getInitials } from "@/lib/initials";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useConfirmation } from "@/hooks/useConfirmation";
import { Pencil, Trash2 } from "lucide-react";

type AdminUser = { id: string; name: string; email: string; role: string };
type UserAdministrationDetails = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  accountType: string;
  platformRoles: string[];
  status: "Active" | "Suspended";
  banReason: string;
  emailVerified: boolean;
  linkedProviders: string[];
  hasPassword: boolean;
  activeSessionCount: number;
  ownership: {
    weddings: Array<{
      id: string;
      name: string;
      weddingKey: string;
      weddingDate: string;
      venue: string;
    }>;
    businesses: Array<{ id: string; name: string; services: string[]; claimed: boolean }>;
  };
};

export function AdminUsersPanel({
  initialUsers,
  initialPagination,
  canManage,
}: {
  initialUsers: AdminUser[];
  initialPagination: PaginationMetadata;
  canManage: boolean;
}) {
  const { text } = useLanguage();
  const confirmation = useConfirmation();
  const [users, setUsers] = useState(initialUsers);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("all");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [details, setDetails] = useState<UserAdministrationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  async function openEditor(user: AdminUser) {
    setEditing(user);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const result = await apiRequest<UserAdministrationDetails>(
        `/api/v1/admin/users?userId=${user.id}`,
        {
          cache: "no-store",
        },
      );
      setDetails(result);
    } catch (error) {
      setEditing(null);
      toast.error(
        text(error instanceof Error ? error.message : "User details could not be loaded."),
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function saveUser(values: Record<string, string | boolean>) {
    if (!editing) return;
    try {
      await apiRequest("/api/v1/admin/users", {
        method: "PATCH",
        body: JSON.stringify({
          userId: editing.id,
          ...values,
        }),
      });
      toast.success(text("User updated."));
      setEditing(null);
      await loadPage(pagination.page);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "The user could not be updated."));
    }
  }

  async function deleteUser(user: AdminUser) {
    const confirmed = await confirmation.confirm({
      title: "Delete user",
      description: "Delete this user? This cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    try {
      await apiRequest("/api/v1/admin/users", {
        method: "DELETE",
        body: JSON.stringify({ userId: user.id }),
      });
      toast.success(text("User deleted."));
      await loadPage(pagination.page);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "The user could not be deleted."));
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
      />
      <div className="request-list">
        {users.length ? (
          users.map((user) => (
            <div key={user.id} className="py-2">
              <span className="avatar">{getInitials(user.name)}</span>
              <p>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </p>
              <StatusPill tone={user.role === "SystemAdmin" ? "rose" : "neutral"}>
                {user.role}
              </StatusPill>
              {canManage && (
                <div className="ml-auto flex gap-2 max-sm:col-span-full max-sm:ml-12 max-sm:pb-3">
                  <Button
                    className="px-3"
                    type="button"
                    variant="secondary"
                    onClick={() => void openEditor(user)}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    className="px-3"
                    type="button"
                    aria-label={text("Delete")}
                    variant="blush"
                    onClick={() => void deleteUser(user)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              )}
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
      <UserManagementDialog
        open={editing !== null}
        details={details}
        loading={detailsLoading}
        onClose={() => setEditing(null)}
        onSave={saveUser}
      />
      {confirmation.dialog}
    </article>
  );
}

function UserManagementDialog({
  open,
  details,
  loading,
  onClose,
  onSave,
}: {
  open: boolean;
  details: UserAdministrationDetails | null;
  loading: boolean;
  onClose: () => void;
  onSave: (values: Record<string, string | boolean>) => Promise<void>;
}) {
  const { text } = useLanguage();
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    setForm({});
  }, [details?.id]);

  function update(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      name: String(form.name ?? current.name),
      firstName: String(form.firstName ?? current.firstName),
      lastName: String(form.lastName ?? current.lastName),
      phoneNumber: String(form.phoneNumber ?? current.phoneNumber),
      accountType: String(form.accountType ?? current.accountType),
      status: String(form.status ?? current.status),
      banReason: String(form.banReason ?? current.banReason),
      emailVerified: Boolean(form.emailVerified ?? current.emailVerified),
      revokeSessions: Boolean(form.revokeSessions),
    });
  }

  const current = details ?? {
    name: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    accountType: "Couple",
    platformRoles: [],
    status: "Active" as const,
    banReason: "",
    emailVerified: false,
    linkedProviders: [],
    hasPassword: false,
    activeSessionCount: 0,
    ownership: { weddings: [], businesses: [] },
    id: "",
  };

  return (
    <Modal
      open={open}
      title="Manage user"
      description="Review and update this account without exposing credentials."
      onClose={onClose}
    >
      {loading ? (
        <p className="text-sm text-yes-muted">{text("Loading user details…")}</p>
      ) : (
        <form className="grid gap-5" onSubmit={submit}>
          <fieldset className="grid gap-3 rounded-xl border border-yes-line p-4">
            <legend className="px-1 text-sm font-bold">{text("Profile")}</legend>
            <ReadOnlyField label="Email" value={current.email} />
            <EditableField
              label="Full name"
              value={String(form.name ?? current.name)}
              onChange={(value) => update("name", value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <EditableField
                label="First name"
                value={String(form.firstName ?? current.firstName)}
                onChange={(value) => update("firstName", value)}
              />
              <EditableField
                label="Last name"
                value={String(form.lastName ?? current.lastName)}
                onChange={(value) => update("lastName", value)}
              />
            </div>
            <EditableField
              label="Phone number"
              value={String(form.phoneNumber ?? current.phoneNumber)}
              onChange={(value) => update("phoneNumber", value)}
            />
          </fieldset>

          <fieldset className="grid gap-3 rounded-xl border border-yes-line p-4">
            <legend className="px-1 text-sm font-bold">{text("Account status")}</legend>
            <label className="grid gap-1.5 text-sm font-bold">
              {text("Status")}
              <select
                className="h-11 px-3 text-sm"
                value={String(form.status ?? current.status)}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="Active">{text("Active")}</option>
                <option value="Suspended">{text("Suspended")}</option>
              </select>
            </label>
            <EditableField
              label="Suspension reason"
              value={String(form.banReason ?? current.banReason)}
              onChange={(value) => update("banReason", value)}
            />
          </fieldset>

          <fieldset className="grid gap-3 rounded-xl border border-yes-line p-4">
            <legend className="px-1 text-sm font-bold">{text("Authentication")}</legend>
            <div className="flex flex-wrap gap-2 text-sm">
              <strong>{text("Sign-in providers")}</strong>
              {current.linkedProviders.length || current.hasPassword ? (
                [
                  ...current.linkedProviders,
                  ...(current.hasPassword ? ["Email and password"] : []),
                ].map((provider) => (
                  <StatusPill key={provider} tone="neutral">
                    {provider}
                  </StatusPill>
                ))
              ) : (
                <span className="text-yes-muted">{text("None connected")}</span>
              )}
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                checked={Boolean(form.emailVerified ?? current.emailVerified)}
                onChange={(event) => update("emailVerified", event.target.checked)}
                type="checkbox"
              />
              {text("Email address verified")}
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                checked={Boolean(form.revokeSessions)}
                onChange={(event) => update("revokeSessions", event.target.checked)}
                type="checkbox"
              />
              {text("Revoke all active sessions on save")}
            </label>
            <p className="text-xs text-yes-muted">
              {text("Active sessions")}: {current.activeSessionCount}
            </p>
          </fieldset>

          <fieldset className="grid gap-3 rounded-xl border border-yes-line p-4">
            <legend className="px-1 text-sm font-bold">{text("Roles")}</legend>
            <label className="grid gap-1.5 text-sm font-bold">
              {text("Customer account type")}
              <select
                className="h-11 px-3 text-sm"
                value={String(form.accountType ?? current.accountType)}
                onChange={(event) => update("accountType", event.target.value)}
              >
                {["Couple", "Vendor", "Venue", "Guest"].map((role) => (
                  <option key={role} value={role}>
                    {text(role)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <strong>{text("Platform staff roles")}</strong>
              {current.platformRoles.length ? (
                current.platformRoles.map((role) => (
                  <StatusPill key={role} tone="rose">
                    {role}
                  </StatusPill>
                ))
              ) : (
                <span className="text-yes-muted">{text("No platform staff role")}</span>
              )}
            </div>
            <p className="text-xs text-yes-muted">
              {text("Platform staff roles are managed from the Platform staff page.")}
            </p>
          </fieldset>

          <fieldset className="grid gap-3 rounded-xl border border-yes-line p-4">
            <legend className="px-1 text-sm font-bold">{text("Ownership relationships")}</legend>
            <OwnershipList
              title="Weddings"
              items={current.ownership.weddings.map(
                (item) => `${item.name}${item.weddingDate ? ` · ${item.weddingDate}` : ""}`,
              )}
            />
            <OwnershipList
              title="Businesses"
              items={current.ownership.businesses.map(
                (item) => `${item.name}${item.claimed ? ` · ${text("Claimed")}` : ""}`,
              )}
            />
          </fieldset>

          <div className="mt-1 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={onClose}>
              {text("Cancel")}
            </Button>
            <Button type="submit">{text("Save changes")}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function EditableField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const { text } = useLanguage();
  return (
    <label className="grid gap-1.5 text-sm font-bold">
      {text(label)}
      <input
        className="h-11 px-3 text-sm"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const { text } = useLanguage();
  return (
    <label className="grid gap-1.5 text-sm font-bold">
      {text(label)}
      <input className="h-11 bg-yes-soft px-3 text-sm text-yes-muted" readOnly value={value} />
    </label>
  );
}

function OwnershipList({ title, items }: { title: string; items: string[] }) {
  const { text } = useLanguage();
  return (
    <div className="grid gap-1.5 text-sm">
      <strong>{text(title)}</strong>
      {items.length ? (
        items.map((item) => (
          <span className="rounded-lg bg-yes-soft px-3 py-2" key={item}>
            {item}
          </span>
        ))
      ) : (
        <span className="text-yes-muted">{text("None")}</span>
      )}
    </div>
  );
}
