export type FacebookProfile = {
  id?: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
};

export function mapFacebookProfile(profile: FacebookProfile) {
  const id = profile.id?.trim();
  if (!id) return null;
  const email = profile.email?.trim().toLowerCase();
  return {
    id,
    name: profile.name?.trim() || `Facebook user ${id}`,
    ...(email
      ? { email, emailVerified: profile.email_verified === true }
      : { email: `${id}@facebook.yesplanner.invalid`, emailVerified: false }),
  };
}
