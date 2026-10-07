# API versioning

The current JSON API is under `/api/v1`. Additive fields may be introduced when existing consumers can ignore them. Changes to ownership semantics, pagination response shape, required request fields, or authorization behavior need compatibility review and tests.

Keep browser clients and API response types aligned. If a breaking migration is required, introduce a new version or a documented transition period rather than silently changing a shared contract.
