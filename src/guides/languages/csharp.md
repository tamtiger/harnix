# C# guide

## Verify

```text
dotnet build -warnaserror
dotnet format --verify-no-changes
dotnet test
```

## Constraints

- Set `<Nullable>enable</Nullable>` and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in every project.
- Never call `.Result` or `.Wait()` on a Task; await it.
- Accept a `CancellationToken` in every async method and pass it to every downstream I/O call.
- Dispose with `using var` or `await using var`; implement `IAsyncDisposable` for async cleanup.
- Never call `serviceProvider.GetService<T>()` in business code; inject through constructors.
- Bind options with `IOptions<T>` and `.ValidateOnStart()`.
- Parameterize SQL (EF Core or Dapper); never interpolate user input into command text.
- Start processes with `UseShellExecute = false` and `ArgumentList`, never a concatenated string.
- Expose `IReadOnlyList<T>` or `ImmutableArray<T>` in public signatures, not mutable collections.
- Never log tokens, credentials or PII.

## Common mistakes

- Injecting a `Scoped` service into a `Singleton`.
- Swallowing `OperationCanceledException` in a generic `catch`.
- Using `async void` outside event handlers.
- Passing raw `Guid` or `long` ids instead of typed ids.
- Building `ProcessStartInfo.Arguments` from user input.
