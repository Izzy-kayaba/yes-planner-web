# API error handling

An API error is an explicit response, not an empty list or a success-shaped fallback. Return a meaningful HTTP status and a JSON body such as `{ "message": "A readable explanation." }`.

- `400`: invalid query or body.
- `401`: missing or invalid session.
- `403`: authenticated caller lacks the required role or relationship.
- `404`: the requested resource does not exist or is not available to this caller.
- `409`: a valid request conflicts with persisted state.
- `429`: a documented rate limit has been reached.
- `5xx`: the server or a required dependency failed.

Do not expose credentials, database connection details, stack traces, or private record contents. Log operational failures with enough non-sensitive context to investigate. In the browser, show a translated message when a known error is available and preserve failures rather than silently continuing.
