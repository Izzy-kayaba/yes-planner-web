# User types

The application distinguishes a person's account role from the services offered by a business.

| Account type  | Current purpose                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `Couple`      | Owns and manages a wedding and can invite or assign collaborators.                               |
| `Vendor`      | Maintains a vendor profile and may offer one or more business services.                          |
| `Venue`       | Maintains a venue business profile and receives read-only access to an assigned wedding brief.   |
| `Guest`       | Responds to an invitation; does not receive workspace access.                                    |
| `SystemAdmin` | Protected administrative access for platform operations. It is not a public registration choice. |

Wedding planning is a Vendor service, not a separate account role. A Vendor must still be assigned by the couple before accessing that couple's wedding. A Venue is not a wedding planner and does not receive full wedding-management access.

The current Venue account is not an organisation with staff accounts. See [organisations](../domains/organisations.md) and the [venue organisation decision](../decisions/ADR-004-venue-organisation-model.md).
