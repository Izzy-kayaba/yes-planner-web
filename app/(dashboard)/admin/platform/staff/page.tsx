import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminStaffPanel } from "@/features/admin/AdminStaffPanel";
import { requirePlatformPagePermission } from "@/lib/auth/platform-admin";
import { hasPlatformPermission } from "@/lib/auth/platform-permissions";
import { isPlatformStaffRole } from "@/lib/auth/roles";
import { ensureMongoIndexes, mongoDb } from "@/lib/mongodb";
import { paginatedResult, parsePagination } from "@/lib/api/pagination";
import type { ObjectId } from "mongodb";

export const metadata: Metadata = { title: "Platform staff" };

export default async function AdminStaffPage() {
  const access = await requirePlatformPagePermission("platform_staff.invite");
  const canManageStaff = hasPlatformPermission(access.permissions, "platform_staff.manage");
  const pagination = parsePagination(new URLSearchParams(), 25, 100)!;
  const users = mongoDb.collection<{
    _id: ObjectId;
    name?: unknown;
    email?: unknown;
    role?: unknown;
    accountType?: unknown;
    platformRoles?: unknown;
  }>("user");
  let accounts: {
    _id: ObjectId;
    name?: unknown;
    email?: unknown;
    role?: unknown;
    accountType?: unknown;
    platformRoles?: unknown;
  }[] = [];
  let totalItems = 0;
  if (canManageStaff) {
    await ensureMongoIndexes();
    totalItems = await users.countDocuments();
    accounts = await users
      .find({}, { projection: { name: 1, email: 1, role: 1, accountType: 1, platformRoles: 1 } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(pagination.pageSize)
      .toArray();
  }
  const items = accounts.map((user) => ({
    id: String(user._id),
    name: String(user.name ?? ""),
    email: String(user.email ?? ""),
    accountType: String(user.accountType ?? user.role ?? ""),
    platformRoles: [
      ...new Set([
        ...(Array.isArray(user.platformRoles)
          ? user.platformRoles.filter(isPlatformStaffRole)
          : []),
        ...(user.role === "SystemAdmin" ? ["SuperAdmin" as const] : []),
      ]),
    ],
  }));
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Platform"
        title="Platform staff"
        description={
          canManageStaff
            ? "Invite platform users and manage roles for existing accounts."
            : "Invite a new user to join the platform team."
        }
      />
      <AdminStaffPanel
        initialAccounts={items}
        initialPagination={paginatedResult(items, 1, pagination.pageSize, totalItems).pagination}
        canManageStaff={canManageStaff}
      />
    </div>
  );
}
