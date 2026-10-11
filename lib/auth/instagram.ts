export type InstagramProfile = {
  id?: string;
  user_id?: string;
  username?: string;
  data?: InstagramProfile[];
};

export function mapInstagramProfile(profile: InstagramProfile) {
  const account = profile.data?.[0] ?? profile;
  // Instagram may omit a stable identity; reject it instead of creating an un-linkable account.
  const id = account.user_id?.trim() || account.id?.trim();
  if (!id) return null;
  // Instagram does not provide an email here, so use a non-deliverable placeholder identity.
  const username = account.username?.trim() || `instagram-${id}`;
  return {
    id,
    name: username,
    email: `${id}@instagram.yesplanner.invalid`,
    emailVerified: false,
  };
}
