const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Keep requests same-origin when a deployment has both apex and www aliases.
// A redirect between those aliases cannot be followed during a browser CORS preflight.
function requestUrl(path: string) {
  if (!API_URL || typeof window === "undefined") return `${API_URL}${path}`;

  const configuredUrl = new URL(API_URL, window.location.origin);
  const currentHost = window.location.hostname.replace(/^www\./, "");
  const configuredHost = configuredUrl.hostname.replace(/^www\./, "");
  const isFirstPartyAlias =
    currentHost === configuredHost && configuredUrl.protocol === window.location.protocol;

  return isFirstPartyAlias ? path : `${API_URL}${path}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

type ApiOptions = RequestInit & { token?: string };

/**
 * All backend calls go through one boundary so authentication and API errors
 * can be changed without rewriting feature components.
 */
export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const isFormData = requestOptions.body instanceof FormData;
  // Let the browser set the multipart boundary; JSON requests need an explicit content type.
  const response = await fetch(requestUrl(path), {
    ...requestOptions,
    // The app uses cookie-backed sessions; credentials must accompany API requests.
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    // Prefer the server's actionable message, but keep a clear fallback for non-JSON errors.
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", response.status);
  }

  // A 204 response intentionally has no JSON body to parse.
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
