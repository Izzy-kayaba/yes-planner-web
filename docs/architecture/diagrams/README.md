# Architecture diagrams

Diagrams should describe current behavior separately from proposals. Keep source formats (for example Mermaid) in this directory so changes can be reviewed as text.

## Current request path

```mermaid
flowchart LR
  B[Browser] --> N[Next.js page or API route]
  N --> S[Better Auth session check]
  S --> P[Role, owner, and collaborator policy]
  P --> M[(MongoDB)]
```

## Current wedding access

```mermaid
flowchart TD
  C[Couple owns wedding] --> W[Wedding profile and workspace]
  C -->|assigns service| V[Vendor collaborator]
  V -->|Wedding planning accepted| F[Full manager access for that wedding]
  C -->|assigns Venue| R[Read-only wedding brief]
```

Update the diagrams when the domain or authorization model changes. The organisation and subscription diagrams remain future work until those records exist.
