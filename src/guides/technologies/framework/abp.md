# ABP Framework engineering guide

## Modular architecture and Domain-Driven Design (DDD)

- Structure ABP applications strictly following Domain-Driven Design (DDD) layered architecture: Domain Layer (`Domain`, `Domain.Shared`), Application Layer (`Application`, `Application.Contracts`), Infrastructure Layer (`EntityFrameworkCore`, `MongoDB`), and HTTP API Layer (`HttpApi`, `HttpApi.Client`, `HttpApi.Host`).
- Define explicit ABP module classes inheriting from `AbpModule`. Use the `[DependsOn(...)]` attribute to declare module dependencies explicitly; configure services in `ConfigureServices` and middleware pipelines in `OnApplicationInitialization`. Never create circular module dependencies.
- Model business logic within the Domain Layer: implement Aggregate Roots inheriting from `AggregateRoot<TKey>` or `FullAuditedAggregateRoot<TKey>`. Enforce domain invariants through private property setters and factory methods; avoid creating anemic domain models.
- Keep Application Services (`ApplicationService`) focused on use case orchestration, authorization checks, transaction boundary definition, and mapping domain entities to DTOs. Never expose raw database entities directly across Application Service contracts; always return typed DTOs.
- Isolate interfaces into `Application.Contracts` to allow client applications, mobile apps, and microservices to consume service contracts without taking dependencies on concrete domain or database infrastructure packages.

## Multi-tenancy, data filtering, and Unit of Work

- Leverage ABP's multi-tenancy infrastructure: implement `IMultiTenant` on entities that belong to specific tenants. Never manually write tenant filtering logic in LINQ queries; rely on ABP's automatic `IDataFilter<IMultiTenant>` data filter to enforce strict tenant isolation.
- Understand data filter disabling: only disable data filters (`using (_dataFilter.Disable<IMultiTenant>())`) within privileged administrative use cases, background synchronization jobs, or migration tasks where cross-tenant visibility is explicitly authorized.
- Manage database transactions and data persistence boundaries using ABP's Unit of Work (`IUnitOfWorkManager` or `[UnitOfWork]`). Avoid manual `DbContext.SaveChanges()` calls in application services; let ABP commit changes automatically at the completion of the Unit of Work scope.
- Implement soft-delete and audit tracking automatically by inheriting from `ISoftDelete` and `IAuditedObject`. Ensure domain queries and repository methods respect the `ISoftDelete` filter to prevent accidental access to deleted records.
- Coordinate asynchronous domain events and integration events using ABP's Event Bus (`ILocalEventBus` for in-process decoupling and `IDistributedEventBus` backed by RabbitMQ or Kafka for distributed microservice communication).

## Authorization, validation, and exception handling

- Enforce authorization using ABP's Permission system (`IPermissionDefinitionProvider`). Define fine-grained permissions for every domain resource and protect application services using `[Authorize(MyPermissions.Orders.Create)]` or `AuthorizationService.CheckAsync()`.
- Validate DTOs automatically: implement `IValidatableObject` or use DataAnnotations and FluentValidation. ABP's automatic validation interceptor validates all incoming service arguments before method execution, rejecting invalid payloads with `AbpValidationException`.
- Handle domain and operational failures using ABP's `BusinessException` and `UserFriendlyException`. Assign localized error codes and parameters to exceptions to enable user-friendly, localized error dialogs on frontend clients.
- Rely on ABP's automatic exception handling middleware and exception filters: ABP formats unhandled exceptions into standardized error envelopes while concealing raw SQL messages, stack traces, and database connection strings from unauthorized external clients.
- Configure Auditing (`IAuditingStore`) to automatically record HTTP requests, caller IP addresses, execution durations, and modified entity property diffs for forensic and compliance analysis.

## Testing, performance, and maintenance

- Write automated tests inheriting from ABP's test base classes (`AbpIntegratedTest<TModule>` or `AbpTestBaseWithServiceProvider`). Take advantage of in-memory SQLite database providers or Testcontainers to run comprehensive integration tests without requiring live SQL Server instances.
- Test Application Services through their public interfaces: assert authorization permission rejections, data validation failures, and correct entity state persistence within unit of work scopes.
- Optimize database queries by implementing custom repository methods with eager loading (`IncludeDetails`) only when necessary, preventing N+1 queries while avoiding over-fetching unnecessary entity graphs.
- Cache frequently queried, read-heavy reference data using ABP's distributed caching abstraction (`IDistributedCache<TCacheItem, TCacheKey>`). Set explicit absolute and sliding expiration policies to prevent memory bloating in Redis.
- Keep ABP CLI tools, NuGet packages, and client libraries synchronized to matching minor versions (`abp update`) to prevent subtle binary incompatibilities and runtime DI registration errors.
