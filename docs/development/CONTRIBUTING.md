# Contributing

Before changing code, identify the owning feature, shared API contract, and server authorization path. Keep pull requests focused and include tests for changed behavior.

For user-facing copy, update the English and French catalog together. For data or access changes, update the domain and architecture documentation. Do not edit generated output or remove existing work that is outside the task.

Before opening a pull request:

1. Run `npm.cmd run test:all`.
2. Review `git diff --check` and the staged/unstaged changes separately.
3. Confirm there are no secrets, local environment files, test credentials, or customer data in the diff.
4. Describe any tests requiring staging credentials that could not be run locally.
