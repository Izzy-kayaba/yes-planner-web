import type { WorkspaceModule } from "@/lib/api/contracts";
import { parsePhoneNumberFromString } from "libphonenumber-js";

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
  // Reject ambiguous major-unit field names; the app stores monetary values as minor units.
  const invalidField = Object.keys(data).find((field) => forbiddenMoneyFields.has(field));
  if (invalidField) return `${invalidField} cannot be stored. Store USD minor units only.`;
  // Each money-bearing module has a specific set of fields that must be safe non-negative integers.
  for (const field of requiredMoneyFields[module] ?? []) {
    const value = data[field];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      return `${field} must be a non-negative USD minor-unit integer.`;
    }
  }
  return null;
}

export function validateWorkspaceRecord(module: WorkspaceModule, data: Record<string, unknown>) {
  // Guest contact normalization is specific to invitations; other record types need no phone check.
  if (module !== "guests") return null;
  const phone =
    typeof data.phoneNumber === "string" ? parsePhoneNumberFromString(data.phoneNumber) : null;
  if (!phone?.isValid()) return "Enter a valid guest WhatsApp phone number with country code.";
  if (
    typeof data.email === "string" &&
    data.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
  ) {
    return "Enter a valid email address or leave it blank.";
  }
  // Store normalized values so duplicate checks and later delivery use a consistent format.
  data.phoneNumber = phone.number;
  data.email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  return null;
}
