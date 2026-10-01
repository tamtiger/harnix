# ABP guide

## Verify

```text
dotnet build -warnaserror
dotnet test
```

## Constraints

- Keep DDD layers: Domain and Domain.Shared never reference Application, EntityFrameworkCore or HttpApi.
- Declare module dependencies with `[DependsOn]` on `AbpModule` classes; register services in `ConfigureServices`.
- Application services expose DTOs from Application.Contracts only, never entities.
- Inherit aggregates from `AggregateRoot<TKey>` or `FullAuditedAggregateRoot<TKey>`; change state via methods, private setters.
- Let ABP's Unit of Work commit; do not call `SaveChanges()` in application services.
- Implement `IMultiTenant` on tenant data; use `IDataFilter.Disable<IMultiTenant>()` only in privileged scopes.
- Protect services with `[Authorize(Permission)]` and define permissions in `PermissionDefinitionProvider`.
- Throw `BusinessException` with localized error codes; never leak raw exceptions to clients.
- Use `ILocalEventBus`/`IDistributedEventBus` for events; derive tests from `AbpIntegratedTest<TModule>`.
- Keep ABP packages on one version; upgrade with `abp update`.

## Common mistakes

- Returning entities from application services.
- Disabling `ISoftDelete` or tenant filters globally.
- Repository calls in loops instead of `IncludeDetails` or batch queries.
- Mixed ABP package versions causing DI failures.
- Missing permission checks on new application service methods.
