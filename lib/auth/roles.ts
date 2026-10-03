export const platformRoles = ["SystemAdmin", "Couple", "Planner", "Vendor", "Guest"] as const;
export const selfServiceRoles = ["Couple", "Planner", "Vendor"] as const;

export type PlatformRole = (typeof platformRoles)[number];
export type SelfServiceRole = (typeof selfServiceRoles)[number];

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === "string" && platformRoles.includes(value as PlatformRole);
}

export function isSelfServiceRole(value: unknown): value is SelfServiceRole {
  return typeof value === "string" && selfServiceRoles.includes(value as SelfServiceRole);
}
