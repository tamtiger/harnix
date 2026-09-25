# C# engineering guide

## Modern language features, type safety, and nullability

- Target modern C# versions (C# 12+) and .NET runtimes (.NET 8+). Enable nullable reference types (`<Nullable>enable</Nullable>`) across all project files. Treat compiler warnings as errors (`<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`) to prevent null-dereference exceptions and latent bugs.
- Model immutable domain data using positional `record` and `record struct` types with `init`-only properties. Take advantage of non-destructive mutation via `with` expressions (`order with { Status = OrderStatus.Processed }`).
- Leverage modern C# expressive patterns: pattern matching with switch expressions (`value switch { ... }`), collection expressions (`int[] numbers = [1, 2, 3];`), primary constructors on classes and structs, and file-scoped namespace declarations to reduce visual boilerplate.
- Prevent primitive obsession: use strongly-typed identifiers (such as readonly record structs or value objects) for domain entities (`CustomerId`, `OrderId`) rather than passing raw `Guid` or `long` primitives throughout application layers.
- Avoid legacy anti-patterns: never use `ArrayList`, untyped collections, or thread-unsafe static fields. Prefer generic, immutable collections (`IReadOnlyList<T>`, `IReadOnlyDictionary<TKey, TValue>`, `ImmutableArray<T>`) for public method signatures.

## Architecture, Dependency Injection, and Options pattern

- Structure applications following Clean Architecture or Vertical Slice principles: keep transport controllers/endpoints separate from domain use cases, entities, and database persistence layers.
- Use Microsoft's built-in dependency injection container (`Microsoft.Extensions.DependencyInjection`). Register services with appropriate lifecycles: `Transient` for stateless, lightweight operations; `Scoped` for request-scoped database contexts; `Singleton` only for thread-safe shared caches or long-lived factory instances.
- Never use the Service Locator anti-pattern (`serviceProvider.GetService<T>()`) inside domain entities or business services. Inject required dependencies explicitly through constructor parameters.
- Manage configuration using the strongly-typed Options pattern (`IOptions<T>`, `IOptionsSnapshot<T>`). Validate configuration models upon application startup using DataAnnotations or fluent validation via `.ValidateOnStart()`.
- Implement defensive boundary validation on all external input. Validate DTOs at web endpoints and internal service boundaries using FluentValidation before passing data to domain services.

## Asynchronous programming, memory efficiency, and resource lifecycles

- Write fully asynchronous I/O code using `async`/`await`. Always pass a `CancellationToken` into asynchronous method signatures and propagate it across all downstream database queries, HTTP calls, and file operations.
- Avoid the "sync-over-async" anti-pattern: never call `.Result` or `.Wait()` on asynchronous Tasks, as this causes thread-pool starvation and deadlocks in ASP.NET Core and UI synchronization contexts.
- Optimize high-throughput memory allocations using `Span<T>`, `ReadOnlySpan<T>`, and `Memory<T>` for slicing strings, buffers, and byte arrays without incurring managed heap garbage collection overhead.
- Manage unmanaged and disposable resources using `using` declarations (`using var resource = ...;`) or asynchronous disposal (`await using var stream = ...;`). Implement `IAsyncDisposable` alongside `IDisposable` where asynchronous cleanup is required.
- Design background workers and message processors with idempotency and retry policies. Leverage resilience libraries like Polly to configure circuit breakers, bounded exponential backoff retries, and fallback behaviors.

## Security, error hygiene, and testing

- Defend against SQL injection: use Entity Framework Core or Dapper with parameterized SQL queries. Never interpolate untrusted user strings directly into raw SQL statements or command text.
- Prevent command injection: execute external processes via `ProcessStartInfo` with `UseShellExecute = false` and explicit `ArgumentList` entries rather than string concatenations.
- Standardize exception handling: create strongly-typed domain exceptions inheriting from `Exception`. In web services, map domain exceptions to standard RFC 7807 Problem Details HTTP responses using custom middleware or ASP.NET Core's `IExceptionHandler`.
- Write thorough automated unit and integration tests using xUnit or NUnit paired with FluentAssertions. Use `WebApplicationFactory<TProgram>` for end-to-end integration testing of web APIs against mock dependencies or Testcontainers.
- Configure structured logging with Serilog or Microsoft.Extensions.Logging. Include contextual enrichers (correlation ID, tenant ID, user ID), and avoid logging sensitive tokens, credentials, or personally identifiable information (PII).
