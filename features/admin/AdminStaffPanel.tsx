"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Pagination } from "@/components/ui/Pagination";
import { YesSelect } from "@/components/ui/YesSelect";
import { AdminSearch } from "@/features/admin/AdminSearch";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult } from "@/lib/api/contracts";
import { isPlatformStaffRole, platformStaffRoles, type PlatformStaffRole } from "@/lib/auth/roles";

type StaffAccount = {
  id: string;
  name: string;
  email: string;
  accountType: string;
  platformRoles: PlatformStaffRole[];
};

export function AdminStaffPanel({
  initialAccounts,
  initialPagination,
  canManageStaff = true,
}: {
  initialAccounts: StaffAccount[];
  initialPagination: PaginatedResult<StaffAccount>["pagination"];
  canManageStaff?: boolean;
}) {
  const { text } = useLanguage();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [pagination, setPagination] = useState(initialPagination);
  const [roleByUser, setRoleByUser] = useState<Record<string, PlatformStaffRole>>({});
  const [saving, setSaving] = useState("");
  const [search, setSearch] = useState("");
  const [platformRole, setPlatformRole] = useState("all");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<PlatformStaffRole>("Support");
  const [pendingAction, setPendingAction] = useState<{
    account: StaffAccount;
    action: "grant" | "revoke";
    role: PlatformStaffRole;
  } | null>(null);

  async function loadPage(
    page: number,
    overrides: { platformRole?: string; sort?: string; search?: string } = {},
  ) {
    setLoading(true);
    try {
      const nextRole = overrides.platformRole ?? platformRole;
      const nextSort = overrides.sort ?? sort;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
        search: (overrides.search ?? search).trim(),
      });
      if (nextRole !== "all") params.set("platformRole", nextRole);
      if (nextSort !== "default") params.set("sort", nextSort);
      const result = await apiRequest<PaginatedResult<StaffAccount>>(
        `/api/v1/admin/platform/staff?${params}`,
        { cache: "no-store" },
      );
      setAccounts(result.items);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Platform staff could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(
    account: StaffAccount,
    action: "grant" | "revoke",
    role: PlatformStaffRole,
  ) {
    setSaving(account.id);
    try {
      await apiRequest("/api/v1/admin/platform/staff", {
        method: "PATCH",
        body: JSON.stringify({ userId: account.id, role, action }),
      });
      await loadPage(pagination.page);
      toast.success(text(action === "grant" ? "Platform role granted." : "Platform role revoked."));
      setPendingAction(null);
    } catch (error) {
      toast.error(
        text(error instanceof Error ? error.message : "Platform role could not be changed."),
      );
    } finally {
      setSaving("");
    }
  }

  async function inviteStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviting(true);
    setInviteError("");
    try {
      await apiRequest("/api/v1/admin/platform/invitations", {
        method: "POST",
        body: JSON.stringify({
          firstName: inviteFirstName,
          lastName: inviteLastName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      toast.success(text("Platform invitation sent."));
      setInviteOpen(false);
      setInviteFirstName("");
      setInviteLastName("");
      setInviteEmail("");
      setInviteRole("Support");
    } catch (error) {
      setInviteError(
        text(error instanceof Error ? error.message : "The platform invitation could not be sent."),
      );
    } finally {
      setInviting(false);
    }
  }

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{text("Super Admin controls")}</p>
          <h2>{text("Platform staff")}</h2>
        </div>
        <Button onClick={() => setInviteOpen(true)} type="button">
          <UserPlus aria-hidden="true" size={17} />
          {text("Invite platform user")}
        </Button>
      </div>
      <p className="mb-4 text-sm text-yes-muted">
        {text(
          canManageStaff
            ? "Invite platform staff or assign roles to existing accounts."
            : "Invite a new user to join the platform team. Existing staff-role changes are restricted to Super Admins.",
        )}
      </p>
      {canManageStaff && (
        <>
          <AdminSearch
            value={search}
            onChange={setSearch}
            onSearch={() => void loadPage(1)}
            filters={[
              {
                label: "Platform role",
                value: platformRole,
                options: [
                  { value: "all", label: text("All platform roles") },
                  ...platformStaffRoles.map((value) => ({ value, label: text(value) })),
                ],
                onChange: (value) => {
                  setPlatformRole(value);
                  void loadPage(1, { platformRole: value });
                },
              },
            ]}
            sortLabel="Sort accounts"
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
          <div className="grid">
            {accounts.length ? (
              accounts.map((account) => (
                <div
                  className="grid gap-3 border-b border-yes-line py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  key={account.id}
                >
                  <div className="grid min-w-0 gap-1">
                    <strong className="text-sm">{account.name || account.email}</strong>
                    <span className="break-words text-sm text-yes-muted">
                      {account.email} · {text(account.accountType)}
                    </span>
                    <span className="break-words text-sm text-yes-muted">
                      {account.platformRoles.map((role) => text(role)).join(", ") ||
                        text("No platform roles")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <YesSelect
                      ariaLabel={`${text("Platform role")} ${account.email}`}
                      className="w-36 shrink-0"
                      options={platformStaffRoles.map((role) => ({
                        value: role,
                        label: text(role),
                      }))}
                      value={roleByUser[account.id] ?? "Support"}
                      onChange={(role) => {
                        if (isPlatformStaffRole(role)) {
                          setRoleByUser((previous) => ({
                            ...previous,
                            [account.id]: role,
                          }));
                        }
                      }}
                    />
                    <button
                      className="button button-primary"
                      disabled={saving === account.id}
                      onClick={() =>
                        setPendingAction({
                          account,
                          action: "grant",
                          role: roleByUser[account.id] ?? "Support",
                        })
                      }
                      type="button"
                    >
                      {text("Grant")}
                    </button>
                    <button
                      className="button button-secondary"
                      disabled={
                        saving === account.id ||
                        !account.platformRoles.includes(roleByUser[account.id] ?? "Support")
                      }
                      onClick={() =>
                        setPendingAction({
                          account,
                          action: "revoke",
                          role: roleByUser[account.id] ?? "Support",
                        })
                      }
                      type="button"
                    >
                      {text("Revoke")}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-yes-muted">
                {text(
                  search || platformRole !== "all"
                    ? "No matching accounts were found."
                    : "No platform staff accounts are available yet.",
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
        </>
      )}
      <Modal
        open={inviteOpen}
        title="Invite a platform user"
        description="Send a secure, one-time invitation link that expires after 7 days."
        onClose={() => {
          if (!inviting) setInviteOpen(false);
        }}
      >
        <form className="grid gap-4" onSubmit={(event) => void inviteStaff(event)}>
          <label className="grid gap-1.5 text-sm font-bold">
            <span>{text("First name")}</span>
            <input
              autoComplete="given-name"
              className="h-11 px-3 text-sm"
              minLength={2}
              maxLength={80}
              required
              value={inviteFirstName}
              onChange={(event) => setInviteFirstName(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            <span>{text("Last name")}</span>
            <input
              autoComplete="family-name"
              className="h-11 px-3 text-sm"
              minLength={2}
              maxLength={80}
              required
              value={inviteLastName}
              onChange={(event) => setInviteLastName(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            <span>{text("Email address")}</span>
            <input
              autoComplete="email"
              className="h-11 px-3 text-sm"
              maxLength={254}
              required
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            <span>{text("Platform role")}</span>
            <YesSelect
              ariaLabel={text("Platform role")}
              className="w-full"
              options={platformStaffRoles
                .filter((role) => canManageStaff || role !== "SuperAdmin")
                .map((role) => ({ value: role, label: text(role) }))}
              value={inviteRole === "SuperAdmin" && !canManageStaff ? "Support" : inviteRole}
              onChange={(role) => {
                if (isPlatformStaffRole(role)) setInviteRole(role);
              }}
            />
          </label>
          {inviteError && (
            <p aria-live="polite" className="text-sm text-yes-wine">
              {inviteError}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <Button
              disabled={inviting}
              onClick={() => setInviteOpen(false)}
              type="button"
              variant="secondary"
            >
              {text("Cancel")}
            </Button>
            <Button disabled={inviting} type="submit">
              {text(inviting ? "Sending invitation…" : "Send invitation")}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(pendingAction)}
        title={pendingAction?.action === "grant" ? "Confirm platform role" : "Remove platform role"}
        description={
          pendingAction
            ? pendingAction.action === "grant"
              ? `Grant ${text(pendingAction.role)} access to ${pendingAction.account.name || pendingAction.account.email}?`
              : `Remove ${text(pendingAction.role)} access from ${pendingAction.account.name || pendingAction.account.email}?`
            : undefined
        }
        onClose={() => {
          if (!saving) setPendingAction(null);
        }}
      >
        <div className="flex justify-end gap-3">
          <Button
            disabled={Boolean(saving)}
            onClick={() => setPendingAction(null)}
            type="button"
            variant="secondary"
          >
            {text("Cancel")}
          </Button>
          <Button
            disabled={!pendingAction || saving === pendingAction.account.id}
            onClick={() => {
              if (pendingAction) {
                void changeRole(pendingAction.account, pendingAction.action, pendingAction.role);
              }
            }}
            type="button"
            variant={pendingAction?.action === "revoke" ? "secondary" : "primary"}
          >
            {text(
              saving && pendingAction && saving === pendingAction.account.id
                ? "Saving…"
                : pendingAction?.action === "grant"
                  ? "Grant role"
                  : "Remove role",
            )}
          </Button>
        </div>
      </Modal>
    </article>
  );
}
