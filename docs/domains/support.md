# Support requests

Authenticated users can submit a support request with a category, subject, detailed description, and optional wedding reference. The server verifies the requester has access to any referenced wedding before storing it.

Users can list only their own requests. Request descriptions are visible only to the requester and staff with `support.view`; they are not included in general user, wedding, or audit listings.

Support staff with `support.manage` may move a request to Open, In Progress, Waiting for User, Resolved, or Closed. Each change is appended to the request's status history and records a metadata-only audit event.

In browser demo mode, submissions are local to that browser and are not sent to the platform team. The UI says so explicitly.
