// Purpose: implements lib/guests/validation.ts for the Yes Planner web application.
import { mongoDb } from "@/lib/mongodb";

const guestGroups = new Set(["Family", "Friends", "Workmates", "Acquaintance"]);

export async function validateGuestSelections(
  ownerUserId: string,
  weddingKey: string,
  data: Record<string, unknown>,
) {
  // Validate only values that were supplied; invitations may be created before seating and menus exist.
  if (typeof data.group !== "string" || !guestGroups.has(data.group)) {
    return "Choose a valid guest group.";
  }

  const selections = [
    { field: "table", module: "seating", label: "table" },
    { field: "meal", module: "food-drinks", label: "meal option" },
  ] as const;

  for (const selection of selections) {
    const value = data[selection.field];
    if (typeof value !== "string" || !value.trim()) continue;
    // A selected table or meal must belong to this wedding, preventing cross-wedding references.
    const exists = await mongoDb.collection("workspaceItems").findOne({
      ownerUserId,
      weddingKey,
      module: selection.module,
      "data.name": value.trim(),
      deletedAt: { $exists: false },
    });
    if (!exists) return `Choose a ${selection.label} created in this wedding workspace.`;
    data[selection.field] = value.trim();
  }

  data.isCouple = data.isCouple === true;
  data.hasChildren = data.hasChildren === true;
  return null;
}

export async function validateGuestSeat(
  ownerUserId: string,
  weddingKey: string,
  data: Record<string, unknown>,
  recordId?: string,
) {
  const tableName = typeof data.table === "string" ? data.table.trim() : "";
  if (
    !tableName ||
    data.seatIndex === undefined ||
    data.seatIndex === null ||
    data.seatIndex === ""
  ) {
    if (!tableName) delete data.seatIndex;
    return null;
  }
  if (
    typeof data.seatIndex !== "number" ||
    !Number.isInteger(data.seatIndex) ||
    data.seatIndex < 0
  ) {
    return "Choose a valid chair for this guest.";
  }
  const table = await mongoDb.collection("workspaceItems").findOne({
    ownerUserId,
    weddingKey,
    module: "seating",
    "data.name": tableName,
    deletedAt: { $exists: false },
  });
  const capacity = Number(table?.data?.capacity ?? 0);
  if (!table || data.seatIndex >= capacity) return "That chair does not exist on this table.";
  const occupied = await mongoDb.collection("workspaceItems").findOne({
    ownerUserId,
    weddingKey,
    module: "guests",
    recordId: recordId ? { $ne: recordId } : { $exists: true },
    "data.table": tableName,
    "data.seatIndex": data.seatIndex,
    deletedAt: { $exists: false },
  });
  if (occupied) return "That chair is already assigned to another guest.";
  data.seatIndex = Math.trunc(data.seatIndex);
  return null;
}
