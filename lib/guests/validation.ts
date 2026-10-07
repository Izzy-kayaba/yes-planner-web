import { mongoDb } from "@/lib/mongodb";

const guestGroups = new Set(["Family", "Friends", "Workmates", "Acquaintance"]);

export async function validateGuestSelections(
  ownerUserId: string,
  weddingKey: string,
  data: Record<string, unknown>,
) {
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
