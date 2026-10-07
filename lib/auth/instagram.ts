export type InstagramProfile = { id?: string; username?: string };

export function mapInstagramProfile(profile: InstagramProfile) {
  // Instagram may omit a stable identity; reject it instead of creating an un-linkable account.
  if (!profile.id) return null;
  // Instagram does not provide an email here, so use a non-deliverable placeholder identity.
  const username = profile.username?.trim() || `instagram-${profile.id}`;
  return {
    id: profile.id,
    name: username,
    email: `${profile.id}@instagram.yesplanner.invalid`,
    emailVerified: false,
  };
}
