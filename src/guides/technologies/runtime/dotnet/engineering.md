# .NET engineering guide

## Composition and configuration

- Keep the composition root responsible for registering infrastructure, options, authentication, health checks, and hosted services. Domain code should not pull dependencies from `IServiceProvider` or read configuration directly.
- Bind configuration into typed options, validate required options during startup, and distinguish secrets from ordinary operational settings. Do not expose options objects as mutable global state.
- Use the platform logging and telemetry abstractions with structured fields. Keep personally identifiable data, tokens, credentials, and full request bodies out of default logs.
- Register dependencies with the lifetime that matches their ownership. Do not inject scoped services into singletons; create scopes explicitly for background work when required.

## Data access and transactions

- Make persistence boundaries explicit. Keep database/provider concerns behind an application or infrastructure boundary; avoid leaking tracked ORM entities through external APIs.
- For read paths, project only the fields required and use no-tracking queries when no update is intended. For write paths, load the aggregate/state needed to enforce invariants and handle optimistic concurrency deliberately.
- Treat schema changes as deployable artifacts: review migrations, make destructive migrations staged/backward-compatible when zero-downtime matters, and test provider-specific behavior against the intended database.
- Keep transaction scope aligned to one business operation. Coordinate outbox/event delivery, external calls, and retries with a durable pattern rather than assuming an in-memory transaction covers them.

## HTTP, background work, and operations

- Set timeouts and cancellation on outbound HTTP and data calls. Use configured clients/factories rather than constructing clients ad hoc, and classify retryable failures carefully.
- Make background services observable and stoppable: honor cancellation, bound concurrency, surface failures through the configured logging/health model, and avoid untracked fire-and-forget tasks.
- Provide meaningful health/readiness checks for dependencies that can prevent serving traffic. Do not make a health endpoint disclose internals, credentials, or customer data.
- Test configuration binding, DI wiring, serialization, database migrations, authorization, and lifecycle behavior in focused integration tests; keep pure decision logic in fast unit tests.
