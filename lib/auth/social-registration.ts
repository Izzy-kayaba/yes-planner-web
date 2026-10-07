export function isExistingGoogleRegistration(authIntent: string | undefined, createdAt: unknown) {
  // The intent cookie records provider and start time so login flows are not mistaken for sign-ups.
  const [intent, provider, startedAtValue] = authIntent?.split(":") ?? [];
  const startedAt = Number(startedAtValue);
  const createdAtTime = createdAt instanceof Date ? createdAt.getTime() : Number.NaN;

  // A user created before this registration started already has an account to reconcile.
  return (
    intent === "register" &&
    provider === "google" &&
    Number.isFinite(startedAt) &&
    (!Number.isFinite(createdAtTime) || createdAtTime < startedAt)
  );
}
