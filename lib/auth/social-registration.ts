export function isExistingGoogleRegistration(authIntent: string | undefined, createdAt: unknown) {
  const [intent, provider, startedAtValue] = authIntent?.split(":") ?? [];
  const startedAt = Number(startedAtValue);
  const createdAtTime = createdAt instanceof Date ? createdAt.getTime() : Number.NaN;

  return (
    intent === "register" &&
    provider === "google" &&
    Number.isFinite(startedAt) &&
    (!Number.isFinite(createdAtTime) || createdAtTime < startedAt)
  );
}
