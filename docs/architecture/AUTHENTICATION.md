# Authentication

Better Auth runs inside the Next.js server and uses MongoDB for users, sessions, and linked accounts. The browser receives a secure session cookie; the application does not store long-lived access tokens in local storage.

## Account and provider setup

Supported sign-in methods in the code include email/password and optional Google and Instagram OAuth. Provider credentials and callback URLs must be configured separately in each environment. Local callbacks use `http://localhost:3000/api/auth/callback/google` and `/api/auth/callback/instagram`; production callbacks must use the exact HTTPS application domain.

Account linking follows Better Auth verification rules; do not merge accounts based only on an unverified email address. Instagram may not return an email address, so the application uses a non-routable `.invalid` placeholder for the authentication record and keeps real contact information separate.

Password reset and verification email use Resend when correctly configured. Phone numbers are normalized to international E.164 form as part of registration/profile completion.

`Couple`, `Vendor`, `Venue`, and `Guest` are user account types. `SystemAdmin` is a protected role that is granted separately. Wedding planning is a Vendor service, not a separate role. See [user types](../product/USER_TYPES.md).

## Email and notifications

Email verification, password-reset messages, and account test email require `RESEND_API_KEY` and a verified `AUTH_EMAIL_FROM` sender. Email layout is generated in `lib/email.ts`. Keep the Resend key on the server and out of `NEXT_PUBLIC_` configuration.

WhatsApp notifications are optional. They require a configured WhatsApp Business token, phone-number ID, and approved message template. A phone number alone is not consent; the user must opt in through settings.

## Phone and profile completion

Phone numbers use international E.164 format. Email/password registration collects a number directly; social sign-in may require a profile-completion step before business APIs can be used.

Authentication establishes the caller's identity. It does not decide access to a wedding. Every API handler must also apply [authorization rules](AUTHORIZATION.md).
