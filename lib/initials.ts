/** Returns a stable two-character badge label for people, couples, and organisations. */
export function getInitials(value: string) {
  const partnerNames = value
    .split("&")
    .map((part) => part.trim())
    .filter(Boolean);

  if (partnerNames.length > 1) {
    return partnerNames
      .slice(0, 2)
      .map((name) => name[0])
      .join("")
      .toUpperCase();
  }

  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
}
