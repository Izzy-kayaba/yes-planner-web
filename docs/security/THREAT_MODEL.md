# Threat model

| Threat                                               | Current control / expected practice                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Changing a wedding key to view another couple's data | Resolve owner and check active collaboration on the server.                                                 |
| Forged role or owner in a request body               | Derive identity from the session; validate resource ownership server-side.                                  |
| Publicly exposing messages or documents              | Keep routes authenticated and scoped; don't reuse public profile media endpoints.                           |
| Malicious input in a profile or workspace record     | Validate and bound input before persistence and output.                                                     |
| Credential leakage                                   | Keep secrets in environment/secret managers, redact logs, and never put secrets in `NEXT_PUBLIC_` settings. |
| Abuse of uploads or claims                           | Apply size/type checks, ownership checks, and rate limits where configured.                                 |
| Compromised demo browser data                        | Do not use demo mode for production accounts or sensitive information.                                      |

The current public profile image upload checks an image signature and size but does not run malware scanning or metadata stripping. Production media hardening is deferred and must be designed before documents or private media are added.
