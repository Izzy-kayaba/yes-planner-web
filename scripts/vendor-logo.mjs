// Purpose: validates and downloads official business logo images for seeded profiles.

export const maximumLogoBytes = 5_000_000;

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

// Only explicit HTTPS sources are accepted so seeding cannot fetch local or unencrypted resources.
export function normalizeLogoSourceUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = new URL(value.trim());
  if (url.protocol !== "https:") {
    throw new Error("Logo sources must use HTTPS.");
  }
  return url.toString();
}

// Validate the bytes as well as the declared response type before storing public media.
export function detectLogoContentType(buffer, declaredType) {
  const contentType = declaredType.split(";", 1)[0].trim().toLowerCase();
  if (!imageTypes.has(contentType)) return null;
  if (
    contentType === "image/jpeg" &&
    buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  ) {
    return contentType;
  }
  if (
    contentType === "image/png" &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return contentType;
  }
  if (
    contentType === "image/webp" &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return contentType;
  }
  if (
    contentType === "image/svg+xml" &&
    /^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(buffer.toString("utf8"))
  ) {
    return contentType;
  }
  return null;
}

// Fetch a logo from an explicitly approved official source and return safe binary metadata.
export async function downloadLogo(sourceUrl, fetchImplementation = fetch) {
  const normalizedUrl = normalizeLogoSourceUrl(sourceUrl);
  if (!normalizedUrl) return null;
  const response = await fetchImplementation(normalizedUrl, {
    headers: { Accept: "image/jpeg,image/png,image/webp,image/svg+xml" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Logo download returned HTTP ${response.status}.`);
  }
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > maximumLogoBytes) {
    throw new Error("Logo is larger than 5 MB.");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > maximumLogoBytes) {
    throw new Error("Logo is empty or larger than 5 MB.");
  }
  const contentType = detectLogoContentType(buffer, response.headers.get("content-type") ?? "");
  if (!contentType) {
    throw new Error("Logo must be a valid JPG, PNG, WebP, or SVG image.");
  }
  return { buffer, contentType, sourceUrl: normalizedUrl };
}
