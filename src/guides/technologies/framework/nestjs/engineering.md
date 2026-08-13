# NestJS engineering guide

## Module and application design

- Use modules to define explicit provider ownership and exports. A module should expose a small public surface; avoid turning one global module into an implicit dependency container.
- Keep controllers transport-focused: parse request values, invoke an application service, and map the response. Keep use cases in providers/services and persistence in repositories/adapters.
- Do not inject framework request/response objects into ordinary application services unless the use case is inherently transport-specific. Pass typed values instead.
- Avoid circular module/provider dependencies as an architectural default. `forwardRef` can unblock a narrow legacy case, but it is a signal to reconsider responsibility boundaries.

## Validation, authorization, and errors

- Validate DTOs at the boundary with a configured global `ValidationPipe` or an equally explicit route-level policy. Choose `whitelist`, transformation, and unknown-property behavior deliberately; tests should prove the intended rejection behavior.
- Keep authentication, authorization, and resource ownership in guards/policies/application services as appropriate. A decorator that documents a role is not enough unless the corresponding guard enforces it.
- Use exception filters/interceptors for consistent transport error mapping and safe observability. Do not expose internal stack traces, database errors, or secrets.
- Validate configuration on startup and inject typed configuration rather than reading environment variables throughout providers.

## I/O, lifecycle, and testing

- Pass cancellation/timeouts into outbound clients where available. Make queues, schedulers, and background consumers idempotent, observable, and safe to stop.
- Write unit tests for provider decisions with narrow mocks of true boundaries. Use Nest testing modules for DI wiring, guards, pipes, controllers, and interceptors when those integrations are the behavior under test.
- Test DTO validation, authentication/authorization, serialization, and failure mapping through observable HTTP or message outcomes. Do not assert container internals as a substitute for behavior.
