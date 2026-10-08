# Yes Planner documentation

This documentation distinguishes **what the application does today** from **ideas that are planned**. A planned feature must not be treated as an available permission, API, or production guarantee.

## Start here

- [Product overview](product/PRODUCT_OVERVIEW.md) explains what Yes Planner is.
- [User types](product/USER_TYPES.md) explains the account types and who can use each area.
- [System overview](architecture/SYSTEM_OVERVIEW.md) shows how the application fits together.
- [Local setup](development/LOCAL_SETUP.md) gets a new developer running the project.
- [Testing](development/TESTING.md) describes the one-command checks and browser suites.
- [API conventions](api/API_CONVENTIONS.md) explains authentication, pagination, and errors; the [endpoint reference](api/ENDPOINTS.md) documents every implemented HTTP route.
- [Security model](security/SECURITY_MODEL.md) describes the current access boundary.
- [Environments](operations/ENVIRONMENTS.md) explains configuration and safe database script use.

## Documentation map

### Product

- [Product overview](product/PRODUCT_OVERVIEW.md)
- [User types](product/USER_TYPES.md)
- [Business model](product/BUSINESS_MODEL.md)
- [Feature matrix](product/FEATURE_MATRIX.md)
- [Roadmap](product/ROADMAP.md)

### Architecture

- [System overview](architecture/SYSTEM_OVERVIEW.md)
- [Domain model](architecture/DOMAIN_MODEL.md)
- [Authentication](architecture/AUTHENTICATION.md)
- [Authorization](architecture/AUTHORIZATION.md)
- [Multi-tenancy](architecture/MULTI_TENANCY.md)
- [Data architecture](architecture/DATA_ARCHITECTURE.md)
- [API architecture](architecture/API_ARCHITECTURE.md)
- [Frontend architecture](architecture/FRONTEND_ARCHITECTURE.md)
- [Integration architecture](architecture/INTEGRATION_ARCHITECTURE.md)
- [Diagrams](architecture/diagrams/README.md)

### Product domains

- [Weddings](domains/weddings.md), [couples](domains/couples.md), [organisations](domains/organisations.md), and [venues](domains/venues.md)
- [Vendors](domains/vendors.md), [wedding planners](domains/wedding-planners.md), [guests](domains/guests.md), [marketplace](domains/marketplace.md), and [subscriptions](domains/subscriptions.md)
- [Platform administration](domains/platform-administration.md)
- [Support requests](domains/support.md)

### Decisions

- [Decision index](decisions/README.md)
- [ADR-001: Wedding ownership](decisions/ADR-001-wedding-ownership.md)
- [ADR-002: Business service model](decisions/ADR-002-business-service-model.md)
- [ADR-003: Planner access](decisions/ADR-003-planner-access-model.md)
- [ADR-004: Venue organisation model](decisions/ADR-004-venue-organisation-model.md)
- [ADR-005: Authorization](decisions/ADR-005-authorization-model.md)
- [ADR-006: Platform staff roles](decisions/ADR-006-platform-roles.md)

### API, security, and operations

- [Endpoint reference](api/ENDPOINTS.md), [API conventions](api/API_CONVENTIONS.md), [error handling](api/ERROR_HANDLING.md), [versioning](api/VERSIONING.md)
- [Security model](security/SECURITY_MODEL.md), [permission matrix](security/PERMISSION_MATRIX.md), [data access](security/DATA_ACCESS.md), [threat model](security/THREAT_MODEL.md)
- [Platform staff roles](security/PLATFORM_ROLES.md), [administrative access](security/ADMIN_ACCESS.md)
- [Environments](operations/ENVIRONMENTS.md), [deployment](operations/DEPLOYMENT.md), [observability](operations/OBSERVABILITY.md), [backup and recovery](operations/BACKUP_RECOVERY.md), [incident response](operations/INCIDENT_RESPONSE.md), [media roadmap](operations/MEDIA_STORAGE_ROADMAP.md)

### Development

- [Local setup](development/LOCAL_SETUP.md)
- [Contributing](development/CONTRIBUTING.md)
- [Testing](development/TESTING.md)
- [Database migrations](development/DATABASE_MIGRATIONS.md)
- [Coding standards](development/CODING_STANDARDS.md)

## Keeping docs accurate

When a change affects behavior, update its domain and architecture page in the same change. Clearly label work that is only proposed. Do not add real secrets, customer data, or production credentials to documentation.
