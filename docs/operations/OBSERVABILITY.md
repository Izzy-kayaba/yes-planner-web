# Observability

Use hosting-platform logs and the application health route to investigate availability. Log enough context to correlate failures (route, operation, environment, safe record identifier, and error category) without writing passwords, tokens, email bodies, or full personal records.

For external-provider failures, record the provider status and a sanitized error. Browser responses should be useful but must not expose internal connection details.

Current application telemetry is limited; there is no complete metrics, tracing, or alerting platform configured in this repository. Production operators should configure log retention, error alerts, database availability monitoring, and authentication/provider failure alerts in the hosting environment.
