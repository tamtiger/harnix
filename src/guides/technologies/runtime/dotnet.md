# .NET guide

## Verify

```text
dotnet build -warnaserror
dotnet format --verify-no-changes
dotnet test
dotnet list package --vulnerable
```

## Constraints

- Enable `<Nullable>enable</Nullable>` and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`; fix warnings, do not suppress.
- Pin the SDK in `global.json`; use central package versions in `Directory.Packages.props`.
- Register services through DI with correct lifetimes; never resolve scoped services from singletons.
- Use `IHttpClientFactory` or typed clients; never `new HttpClient()` per request.
- Bind config with `IOptions<T>` and `ValidateOnStart()`; keep secrets in User Secrets or environment.
- Go async end-to-end with `CancellationToken`; never `.Result` or `.Wait()`.
- Use `ILogger<T>` with structured message templates, not string interpolation.
- EF Core: use `AsNoTracking()` for reads, `Include` or projection to avoid N+1, and committed migrations.
- Use `IExceptionHandler` and `ProblemDetails` for API errors; add health check endpoints.
- Avoid `async void` except event handlers.

## Common mistakes

- `HttpClient` created per call exhausting sockets.
- Sync-over-async deadlocks from `.Result` in request paths.
- Disposing `IDisposable` incorrectly, or not at all.
- Secrets in `appsettings.json`.
- Returning EF entities directly from controllers.
