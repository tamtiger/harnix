# .NET runtime engineering guide

## Application hosting, Kestrel server, and configuration

- Target modern .NET LTS versions (.NET 8 or .NET 9+). Structure host bootstrap using `WebApplication.CreateBuilder(args)` with Minimal APIs or controller patterns depending on API surface complexity and middleware needs.
- Configure Kestrel defensively for high-load production workloads: configure explicit request limits (`Limits.MaxRequestBodySize`, `Limits.MaxRequestLineSize`, `Limits.KeepAliveTimeout`), disable HTTP/1.1 or HTTP/2 unencrypted cleartext when TLS is termination-proxied, and enforce strict socket deadlines.
- Manage configuration hierarchically via `IConfiguration` utilizing layered providers: `appsettings.json`, environment-specific overrides (`appsettings.Production.json`), environment variables, and secure secrets vaults (Azure Key Vault, HashiCorp Vault). Never hardcode credentials or connection strings in configuration files.
- Enforce the strongly-typed Options pattern (`IOptions<T>`, `IOptionsSnapshot<T>`) for all configuration sections. Always bind configuration using `.ValidateDataAnnotations()` and `.ValidateOnStart()` to fail deployment startup immediately when required parameters are absent or invalid.
- Implement structured graceful shutdown: handle `IHostApplicationLifetime` events (`ApplicationStopping`, `ApplicationStopped`) to allow in-flight HTTP requests and queue workers to drain cleanly before terminating the hosting process.

## Memory management, Garbage Collection, and Native AOT

- Understand .NET Garbage Collection (GC) modes: configure Server GC (`ServerGarbageCollection = true`) for multi-core server workloads to maximize throughput, or Workstation GC for memory-constrained container environments to maintain small memory footprints.
- Minimize Large Object Heap (LOH) fragmentation: avoid allocating arrays or byte buffers larger than 85,000 bytes directly on the ephemeral heap; utilize `ArrayPool<T>.Shared` to rent and return reusable buffers for high-volume I/O pipelines.
- Leverage Pinned Object Heap (POH) and unmanaged memory interop safely using `Span<T>` and `ReadOnlySpan<T>` to process streams, serialization payloads, and cryptographic tokens without memory pinning overhead.
- Design for Native AOT (Ahead-of-Time compilation) and Trimming where instant startup and low memory footprints are critical (microservices, serverless functions). Avoid unbounded reflection, runtime code generation (`Reflection.Emit`), and non-AOT-compatible serializers; rely strictly on compile-time source generators (e.g., `System.Text.Json` source generation).
- Prevent thread pool starvation: never block thread pool worker threads with synchronous `.Result` or `Thread.Sleep()`. Configure thread pool min/max threads intentionally if anticipating sudden traffic spikes.

## Security, authentication, and HTTP pipeline hygiene

- Secure the ASP.NET Core middleware pipeline: place foundational security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) and CORS at the very front of the pipeline before routing and authorization middlewares execute.
- Enforce authentication and resource authorization policies using ASP.NET Core Authorization Policies (`[Authorize(Policy = "...")]` or `.RequireAuthorization("...")`). Verify user claims, scopes, and tenant isolation explicitly in authorization handlers.
- Defend against Denial-of-Service (DoS) and brute force attacks: configure rate-limiting middleware (`AddRateLimiter`) with fixed window, sliding window, or token bucket algorithms across authentication and heavy computational routes.
- Prevent Cross-Site Request Forgery (CSRF) on cookie-authenticated web applications using Antiforgery tokens (`ValidateAntiForgeryTokenAttribute` or `IAntiforgery`).
- Standardize error handling using `IExceptionHandler` (introduced in .NET 8). Transform unhandled exceptions into standardized RFC 7807 Problem Details JSON payloads while scrubbing internal database error strings, connection details, and stack traces.

## Observability, diagnostics, and testing

- Implement unified observability using OpenTelemetry .NET SDK. Instrument applications with standardized traces (`ActivitySource`), metrics (`Meter`), and structured logging (`ILogger`). Propagate W3C Trace Context headers across distributed services.
- Expose standardized health check endpoints via `AddHealthChecks()`: implement separate probes for liveness (`/healthz`) and readiness (`/readyz`), checking database connectivity, cache status, and message broker heartbeats.
- Write robust integration tests using `WebApplicationFactory<TProgram>` from `Microsoft.AspNetCore.Mvc.Testing`. Override dependencies with mock instances or use Testcontainers for live database and message broker integration testing in CI/CD pipelines.
- Profile runtime performance and identify memory leaks using `dotnet-trace`, `dotnet-dump`, `dotnet-counters`, and `dotnet-gcdump` during load testing.
- Maintain code quality with Roslyn analyzers: enforce `Microsoft.CodeAnalysis.NetAnalyzers` at high severity, and configure editorconfig rules to prevent architectural drift across the team.
