import "server-only";

import type { AuthorizedSession } from "@/lib/auth/session";
import type { DashboardData, DashboardTask, WeddingProfile } from "@/lib/dashboard/types";
import { mongoDb } from "@/lib/mongodb";

type WorkspaceDocument = {
  recordId?: string;
  module?: string;
  data?: Record<string, unknown>;
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function taskFromDocument(document: WorkspaceDocument): DashboardTask {
  const data = document.data ?? {};
  return {
    id: text(document.recordId),
    title: text(data.title),
    category: text(data.category),
    due: text(data.due),
    assignee: text(data.assignee),
    priority: text(data.priority),
    complete: data.complete === true,
  };
}

function weddingFromDocument(document: Record<string, unknown> | null): WeddingProfile | null {
  if (!document) return null;
  return {
    weddingKey: text(document.weddingKey),
    partnerName: text(document.partnerName),
    displayName: text(document.displayName),
    weddingDate: text(document.weddingDate),
    venue: text(document.venue),
    location: text(document.location),
    budgetMinor: typeof document.budgetMinor === "number" ? document.budgetMinor : 0,
    budgetRangeKey: typeof document.budgetRangeKey === "string" ? document.budgetRangeKey : "",
    estimatedGuests: typeof document.estimatedGuests === "number" ? document.estimatedGuests : 0,
    guestRangeKey: typeof document.guestRangeKey === "string" ? document.guestRangeKey : "",
    weddingStyle: text(document.weddingStyle),
    planningNotes: text(document.planningNotes),
  };
}

export function isWeddingProfileComplete(wedding: WeddingProfile | null) {
  return Boolean(
    wedding?.weddingKey &&
    wedding.partnerName &&
    wedding.displayName &&
    wedding.weddingDate &&
    wedding.venue &&
    wedding.location &&
    wedding.budgetMinor > 0 &&
    wedding.estimatedGuests > 0,
  );
}

export async function loadDashboardData(
  session: AuthorizedSession,
  ownerUserId = session.user.id,
): Promise<DashboardData> {
  const activeRecord = { ownerUserId, deletedAt: { $exists: false } };
  const [user, weddingDocument, workspaceDocuments, unreadMessages] = await Promise.all([
    mongoDb.collection("user").findOne({ email: session.user.email }),
    mongoDb.collection("weddingProfiles").findOne({ ownerUserId }),
    mongoDb
      .collection<WorkspaceDocument>("workspaceItems")
      .find({ ...activeRecord, module: { $in: ["guests", "tasks", "vendors"] } })
      .project<WorkspaceDocument>({ recordId: 1, module: 1, data: 1 })
      .toArray(),
    mongoDb.collection("messages").countDocuments({
      recipientUserId: session.user.id,
      readAt: { $exists: false },
    }),
  ]);

  const records = (module: string) =>
    workspaceDocuments.filter((document) => document.module === module);
  const guests = records("guests");
  const tasks = records("tasks");
  const vendors = records("vendors");
  const fullName = text(user?.name) || session.user.name || session.user.email;
  const firstName = text(user?.firstName) || fullName.trim().split(/\s+/)[0] || fullName;

  return {
    user: { firstName, name: fullName, role: session.user.role },
    wedding: weddingFromDocument(weddingDocument),
    counts: {
      guests: guests.length,
      attendingGuests: guests.filter((guest) => guest.data?.status === "Attending").length,
      tasks: tasks.length,
      completedTasks: tasks.filter((task) => task.data?.complete === true).length,
      vendors: vendors.length,
      confirmedVendors: vendors.filter((vendor) => vendor.data?.status === "Confirmed").length,
      unreadMessages,
    },
    tasks: tasks
      .map(taskFromDocument)
      .filter((task) => task.title)
      .slice(0, 4),
  };
}
