# API conventions

- Keep application routes under `/api/v1`.
- Use the authenticated Better Auth session cookie; do not accept a caller-provided owner ID as proof of access.
- Parse and validate request bodies before database writes.
- Scope reads and writes by the authenticated owner and, when applicable, the wedding key.
- Return JSON error objects with a readable `message`.
- Use stable sorting for paginated lists.

## Pagination

List endpoints accept a one-based `page` and `pageSize`. The default page size is 25 and the maximum is 100. Unsafe or out-of-range values return HTTP `400`.

Successful list responses use:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Use `parsePagination` and `paginatedResult` from `lib/api/pagination.ts` rather than reimplementing the contract. See [error handling](ERROR_HANDLING.md).
