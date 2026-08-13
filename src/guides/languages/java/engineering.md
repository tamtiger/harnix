# Java engineering guide

## Model clear contracts

- Keep nullability explicit. Validate external input at the boundary, use `Optional` primarily as a return type for potentially absent values, and do not use it as a field, parameter, or substitute for an unresolved invariant.
- Favor immutable value objects, records, and narrow interfaces for stable data. Keep entities responsible for their own invariants instead of scattering business rules across controllers and mappers.
- Use meaningful domain exceptions or result types for expected business outcomes. Do not swallow exceptions, return `null` as an undocumented error signal, or leak persistence exceptions through an API boundary unintentionally.
- Keep package visibility and module boundaries intentional. Avoid static mutable global state, especially for request context, configuration, and test setup.

## Resource and concurrency safety

- Use try-with-resources for streams, files, database handles, and other `AutoCloseable` resources. It provides a clear lifetime even when work fails midway.
- Set timeouts on remote calls, model retryable failures explicitly, and avoid retrying non-idempotent writes without a durable idempotency or transaction strategy.
- Prefer immutable data across threads. When mutable state must be shared, make the synchronization and ownership visible; do not depend on incidental thread safety of surrounding frameworks.
- Keep transaction boundaries around a business operation, not around arbitrary helper methods. Be clear about propagation, rollback rules, and lazy-loading expectations.

## Maintainable implementation

- Use the repository formatter and static-analysis configuration. Favor readable control flow over deeply nested conditionals and clever stream chains that obscure error handling or resource ownership.
- Use streams for clear collection transformations, not as a replacement for every loop. Streams obtained from I/O are resources and must be closed.
- Keep mapping between transport DTOs, application commands, and persistence entities explicit. Do not bind external JSON directly to a persistence model with fields callers should not control.

## Testing

- Use JUnit fixtures that state the scenario and assert the observable outcome. Keep unit tests free of container startup unless framework wiring is the behavior under test.
- Add integration tests for transaction semantics, serialization, schema queries, authorization, and remote-client adapters. Make test data isolated and deterministic.
- Test validation and error translation at public boundaries, including malformed input and absent resources; do not rely solely on a successful service invocation.
