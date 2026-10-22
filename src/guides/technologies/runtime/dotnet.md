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
- Go async end-to-end with `CancellationToken`; never `.Result` or `.Wait()`; no `async void` except event handlers.
- Use `ILogger<T>` with structured message templates, not string interpolation; mask PII before logging.
- EF Core: use `AsNoTracking()` for reads, `Include` or projection to avoid N+1, `AsSplitQuery()` for multi-collections, and `HasQueryFilter` for soft delete.
- EF Core concurrency and security: use `[Timestamp]` or `IsRowVersion()` tokens, parameterize all SQL (`FromSql`, Dapper), and committed migrations with rollback tests.
- Use `IExceptionHandler` and `ProblemDetails` with `[DOMAIN]_[ACTION]_[REASON]` codes (no stack traces or paths); enforce authorization with `[Authorize]`/`RequireAuthorization`.

## Common mistakes

- `HttpClient` created per call exhausting sockets.
- Sync-over-async deadlocks from `.Result` in request paths.
- Disposing `IDisposable` incorrectly, or not at all.
- Secrets in `appsettings.json`.
- Returning EF entities directly from controllers or suppressing concurrency exceptions without retrying.
