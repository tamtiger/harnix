# Go engineering guide

## Architecture, package organization, and idiomatic design

- Structure Go applications following standard idiomatic layout: place public reusable libraries under `pkg/`, private application binaries under `cmd/`, and internal domain logic under `internal/`. Code placed under `internal/` is strictly enforced by the Go compiler to prevent external package leakage.
- Design small, focused interfaces at the consumer side rather than the producer side. Follow the Go proverb: "The bigger the interface, the weaker the abstraction." Return concrete structs from constructor functions (`NewService(...) *Service`) and accept interfaces as parameters.
- Avoid package-level mutable global variables, init functions that perform heavy I/O, or ambient singletons. Inject dependencies (database pools, HTTP clients, clocks, loggers) explicitly into struct fields via constructor functions.
- Handle zero-values gracefully: design structs so that their default zero-value is immediately useful and safe to use without requiring explicit initialization where practical (e.g., `sync.Mutex`, `bytes.Buffer`).
- Manage dependencies strictly via `go.mod` and `go.sum`. Keep dependencies minimal, vet third-party licenses, and periodically audit dependencies for known vulnerabilities using `govulncheck`.

## Goroutines, concurrency safety, and context propagation

- Manage goroutine lifecycles with absolute discipline: never spawn a goroutine without knowing precisely when, how, and why it will terminate. Uncontrolled goroutines cause memory leaks, connection leaks, and silent deadlocks.
- Always propagate `context.Context` as the first argument in functions performing I/O (`func (s *Service) FetchData(ctx context.Context, id string) (*Data, error)`). Respect context cancellation and deadlines by monitoring `ctx.Done()` inside long-running loops or channel operations.
- Do not store `context.Context` inside struct fields; pass it down the call chain through explicit function arguments.
- Communicate by sharing memory only when appropriate; prefer sharing memory by communicating via channels for pipelining, signaling, and work distribution. For protecting shared in-memory state, use `sync.Mutex` or `sync.RWMutex` with `defer mu.Unlock()` immediately following lock acquisition.
- Always run the Go race detector (`go test -race` and `go run -race`) during local development and CI/CD automated test runs to catch data races before deploying to production.

## Error handling, wrapping, and defensive programming

- Treat errors as ordinary values. Check errors immediately after every function call returning an error; never ignore errors with blank identifier `_` without an explicit, documented reason.
- Wrap errors to provide diagnostic context while preserving the underlying failure cause using `%w` in `fmt.Errorf("failed to load user %s: %w", userID, err)`.
- Inspect and compare errors using standard library functions: use `errors.Is(err, ErrNotFound)` for sentinel error matching and `errors.As(err, &targetErr)` for typed error unwrapping. Avoid brittle string comparisons (`strings.Contains(err.Error(), "not found")`).
- Reserve `panic` exclusively for unrecoverable startup errors (such as invalid regex compilation in `init()` via `regexp.MustCompile`) or programming invariants that indicate corrupted state. Never use panic for normal control flow or expected operational failures.
- Defend against injection vulnerabilities: use parameterized SQL queries with `database/sql` driver bindings (`db.QueryRowContext(ctx, "SELECT ... WHERE id = $1", id)`). Never concatenate untrusted strings into SQL or shell commands.

## Testing, profiling, and tooling

- Write table-driven tests with descriptive subtests using `t.Run(tc.name, func(t *testing.T) { ... })`. Table-driven tests maximize test case coverage while eliminating repetitive testing boilerplate.
- Test failure cases thoroughly: verify error types with `errors.Is` and assert specific error conditions alongside successful happy paths.
- Avoid mocking everything: prefer using real implementations with in-memory SQLite, ephemeral Docker containers, or standard library fakes (`httptest.Server`, `httptest.ResponseRecorder`) over overly complex mock generators.
- Profile memory allocations, CPU utilization, and goroutine blocking using Go's built-in `pprof` tool and benchmark tests (`testing.B`). Minimize heap allocations in high-throughput hot paths by avoiding unnecessary interface boxing and reusing buffers with `sync.Pool`.
- Enforce strict code formatting and quality using standard Go tooling: `gofmt` or `goimports`, and `golangci-lint` configured with strict linters (errcheck, gosimple, govet, ineffassign, staticcheck) in CI pipelines.
