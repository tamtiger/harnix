# C# engineering guide

## Contracts and types

- Keep nullable reference types enabled. Model absence honestly with nullable references, `Nullable<T>`, option/result types already established by the repository, or explicit validation; do not suppress warnings to silence an uncertain contract.
- Prefer immutable inputs and small records/value objects for stable data contracts. Use classes when identity, inheritance, or controlled mutation is meaningful.
- Expose the narrowest useful type. Avoid returning mutable collections, `object`, stringly typed identifiers, or framework entities from a public application boundary when a DTO or domain type communicates the contract better.
- Keep public APIs documented where consumers need semantics, nullability, exception behavior, cancellation, or ordering guarantees. Prefer named arguments or dedicated types over long boolean or primitive parameter lists.

## Async, I/O, and resources

- Use asynchronous APIs all the way through a cancellable I/O path. Never block on a `Task` with `.Result`, `.Wait()`, or sync-over-async bridges in request handling.
- Accept and propagate a `CancellationToken` for externally cancellable work; pass it to database, HTTP, filesystem, and delay APIs that support it. Do not create a new token that discards the caller's cancellation.
- Dispose resources deterministically with `using`/`await using`. Keep `HttpClient` lifecycle under the application's configured factory or established composition root rather than constructing one per request.
- Distinguish expected domain failures from unexpected infrastructure failures. Add operation context when rethrowing or translating exceptions, preserve the original exception as the inner cause when appropriate, and never use exceptions for ordinary branching.

## Design and dependency injection

- Prefer constructor injection and explicit dependencies. A service should coordinate one cohesive use case; extract a collaborator only when it has a stable responsibility, not merely to satisfy a line-count target.
- Keep core domain rules independent of HTTP, Entity Framework, logging, and configuration APIs. Put framework-specific adapters at the outer layer.
- Avoid generic repositories or service abstractions that simply repeat the ORM API. Introduce an interface only where it represents a domain capability, an external system, or a substitutable boundary.
- Make concurrency rules visible. Use optimistic concurrency tokens or explicit transactional coordination when two requests can update the same business fact.

## Testing and quality

- Follow the repository's formatter, analyzer, and test conventions; use `.editorconfig` as executable style policy rather than hand-enforcing personal preferences.
- Unit-test business decisions without a container. Use integration tests for serialization, authorization filters, data mapping, migrations, and provider-specific behavior.
- Use expressive test names, arrange only relevant state, and assert outcomes plus important side effects. Include cancellation, validation, and failure translation when those are part of the contract.
