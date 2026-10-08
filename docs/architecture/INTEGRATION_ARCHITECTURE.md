# Integration architecture

| Integration              | Current use                                                                  | Configuration boundary                           |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| MongoDB                  | Authentication, profiles, requests, workspace data, and current GridFS media | Server-only database variables                   |
| Better Auth              | Sessions, passwords, and linked login providers                              | Server config and provider credentials           |
| Resend                   | Verification, password reset, and account test email                         | Server-only API key and verified sender          |
| Google / Instagram OAuth | Optional social sign-in                                                      | Provider dashboard credentials and callback URLs |
| WhatsApp Business        | Optional event notifications                                                 | Server token, phone-number ID, approved template |
| Exchange-rate endpoint   | South African display conversion                                             | Server-side cached fetch                         |

Integrations must fail clearly when required credentials are absent. Never place server secrets in `NEXT_PUBLIC_` variables or in a client bundle. Do not claim that a provider is configured just because its UI exists.

Internal email integration checks use the existing Resend service via a permission-protected server API. The browser submits only a test recipient; provider credentials remain server-side. Audit events record the integration name and outcome, never recipient or message content.

Production S3-compatible storage and malware scanning were requested but deferred. The existing GridFS implementation remains in place; see the [media storage roadmap](../operations/MEDIA_STORAGE_ROADMAP.md).
