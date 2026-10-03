import type { WorkspaceModule } from "@/lib/api/contracts";

const forbiddenMoneyFields = new Set([
  "currency",
  "price",
  "amount",
  "budget",
  "startingPrice",
  "priceZar",
  "priceUsd",
]);

const requiredMoneyFields: Partial<Record<WorkspaceModule, string[]>> = {
  budget: ["amountMinor", "budgetMinor"],
  vendors: ["priceMinor"],
  bookings: ["amountMinor"],
  payments: ["amountMinor"],
};

export function validateWorkspaceMoney(module: WorkspaceModule, data: Record<string, unknown>) {
  const invalidField = Object.keys(data).find((field) => forbiddenMoneyFields.has(field));
  if (invalidField) return `${invalidField} cannot be stored. Store USD minor units only.`;
  for (const field of requiredMoneyFields[module] ?? []) {
    const value = data[field];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      return `${field} must be a non-negative USD minor-unit integer.`;
    }
  }
  return null;
}
