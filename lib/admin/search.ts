export const adminSearchMaxLength = 100;

export function escapedAdminSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseAdminSearch(searchParams: URLSearchParams) {
  const value = searchParams.get("search")?.trim() ?? "";
  if (value.length > adminSearchMaxLength) return null;
  return value;
}
