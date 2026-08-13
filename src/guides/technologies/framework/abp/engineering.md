# ABP engineering guide

## Preserve the ABP layers

- Keep domain rules in aggregates, value objects, domain services, and domain events. A domain service is appropriate for core logic spanning aggregates or requiring a domain-level dependency; it should operate on domain objects rather than DTOs.
- Keep application services focused on use cases: authorize, validate input, coordinate domain objects/repositories, and return DTOs. Do not expose entities directly through an application service.
- Keep contracts/DTOs in the contracts layer, application implementation in the application layer, and infrastructure/EF Core concerns in the infrastructure layer. Do not let presentation code bypass the application layer to manipulate repositories or entities.
- Use the framework CRUD helpers only when their generated behavior matches the use case. Override or write a dedicated application service when authorization, data filtering, mapping, or domain rules differ materially.

## Multi-tenancy, authorization, and data filters

- Treat the current tenant as request-scoped security context. Never accept a tenant identifier from a caller and use it to bypass the established tenant resolution/authorization flow.
- Preserve ABP data filters and tenant context through application and background work. Disable a filter only in the narrowest scope, document why it is safe, and test the cross-tenant behavior.
- Apply ABP authorization policies declaratively or imperatively at application-service boundaries and enforce resource-level rules for operations where a permission alone is insufficient.
- Use validation attributes/custom validation for DTO input, then keep domain invariants in the domain model. A valid DTO is not proof that a business operation is valid.

## Unit of work and errors

- Let the unit-of-work boundary match an application use case. Do not commit partial domain state early merely to simplify a multi-step method; coordinate external side effects with a durable outbox or equivalent pattern.
- Use framework exception and localization conventions for expected business failures. Use stable, namespaced error codes where clients or localization need to recognize them; do not leak database/provider errors through the API.
- Preserve audit logging and soft-delete behavior unless an explicit, reviewed exception is required. Bulk operations and direct SQL often bypass these conventions and need targeted review.

## Testing

- Use the appropriate ABP test base and module configuration when framework behavior is under test. Cover authorization, validation, tenant isolation, data filters, audit behavior, and unit-of-work rollback.
- Unit-test domain services and aggregates without a web/API host. Add integration coverage for mapping, repositories, EF Core configuration, and application-service wiring.
