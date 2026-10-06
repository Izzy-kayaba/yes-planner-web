export type InstagramProfile = { id?: string; username?: string };

export function mapInstagramProfile(profile: InstagramProfile) {
  if (!profile.id) return null;
  const username = profile.username?.trim() || `instagram-${profile.id}`;
  return {
    id: profile.id,
    name: username,
    email: `${profile.id}@instagram.yesplanner.invalid`,
    emailVerified: false,
  };
}
