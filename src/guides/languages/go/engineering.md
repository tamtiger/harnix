# Go engineering guide

## Package and API design

- Keep packages small, cohesive, and named for what they provide rather than how they are implemented. Avoid `util`, `common`, or circular package dependencies that hide ownership.
- Let concrete types lead. Define interfaces at the consuming boundary when multiple implementations are genuinely useful; keep them small and behavior-oriented.
- Make zero values useful when practical, but do not make an invalid state look valid. Use constructors when invariants, required dependencies, or lifecycle setup need enforcement.
- Return values plus `error` for recoverable failure. Reserve `panic` for truly unrecoverable programmer errors or package-internal invariants that are recovered before crossing a public boundary.

## Errors, context, and resources

- Check every error at the point where a useful decision can be made. Wrap errors with operation context using `%w` when callers need `errors.Is` or `errors.As`; do not stringify away the causal error.
- Keep error messages concise, lower-case, and free of redundant punctuation when following Go conventions. Do not log an error and return it again at every layer; decide where it becomes observable.
- Accept `context.Context` as the first parameter for request-scoped or cancellable work. Propagate it to calls that support cancellation and do not store it in a struct or replace it with `context.Background()` mid-flow.
- Close files, response bodies, rows, and other resources promptly. Check errors from writes and finalization when they can affect correctness.

## Concurrency

- Start goroutines only with a documented owner, shutdown path, and error-reporting path. A goroutine that cannot be stopped, awaited, or observed is a leak risk.
- Prefer channels for communication and mutexes for protecting shared state; choose the simpler model for the invariant. Avoid holding locks during network or filesystem I/O.
- Bound concurrent work and propagate cancellation. Protect maps and shared mutable state, and run the race detector when changing concurrent code.

## Tests and tooling

- Use `gofmt`/`goimports` and the repository's static analysis as non-negotiable baseline tooling.
- Prefer table-driven tests for the same behavior across meaningful cases. Use subtests for named scenarios and `t.Helper()` in assertions/helpers so failures point to the caller.
- Test package behavior through exported APIs where possible. Use temporary directories, test servers, and injected clocks/clients instead of real external services.
- Run `go test` for the affected package before broader checks; add fuzz or property-style cases for parsers and boundary conversions where malformed input is a material risk.
