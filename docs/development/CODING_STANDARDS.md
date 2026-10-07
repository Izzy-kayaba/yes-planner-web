# Coding standards

- Use TypeScript types for shared contracts and validate untrusted request data at runtime.
- Keep shared behavior in a small, well-named helper rather than copying parsing or permission rules across routes.
- Add beginner-friendly comments inside shared helpers and complex functions to explain important rules and non-obvious steps.
- Explain why a meaningful condition, loop, fallback, or ordering decision exists; avoid narrating obvious syntax or adding comments to every line.
- Put comments beside the logic they explain, and update them when behavior changes.
- Keep authorization on the server and query only records the caller is allowed to access.
- Return explicit errors; do not hide failures behind empty arrays, default success values, or broad catch blocks.
- Keep UI strings in the language catalog and add French copy with English copy.
- Keep money in integer minor units and format through the shared currency helpers.
- Add stable database sorting and matching indexes to paginated lists.
- Prefer small feature-local changes and tests over unrelated refactors.

Use `npm.cmd run format:check`, `npm.cmd run check:lines`, `npm.cmd run typecheck`, and `npm.cmd run test:all` before merging.
