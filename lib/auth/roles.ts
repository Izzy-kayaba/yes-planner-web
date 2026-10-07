export const accountTypes = ["Couple", "Venue", "Vendor", "Guest"] as const;
export const platformRoles = ["SystemAdmin", ...accountTypes] as const;
export const selfServiceRoles = ["Couple", "Venue", "Vendor"] as const;

export type AccountType = (typeof accountTypes)[number];
export type PlatformRole = (typeof platformRoles)[number];
export type SelfServiceRole = (typeof selfServiceRoles)[number];

export function isAccountType(value: unknown): value is AccountType {
  return typeof value === "string" && accountTypes.includes(value as AccountType);
}

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === "string" && platformRoles.includes(value as PlatformRole);
}

export function isSelfServiceRole(value: unknown): value is SelfServiceRole {
  return typeof value === "string" && selfServiceRoles.includes(value as SelfServiceRole);
}

/** Converts stored legacy roles without treating a business service as an account type. */
export function accountTypeFromStoredUser(role: unknown, accountType: unknown): AccountType | null {
  if (role === "Planner") return "Vendor";
  if (isAccountType(role)) return role;
  return isAccountType(accountType) ? accountType : null;
}
