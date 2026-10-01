# Go guide

## Verify

```text
gofmt -l .
go vet ./...
staticcheck ./...
go test -race ./...
```

## Constraints

- Use `staticcheck` for linting; gosimple and stylecheck are merged into it (golangci-lint v2).
- Put commands under `cmd/` and private packages under `internal/`; avoid a `pkg/` directory by default.
- Return errors, do not panic; wrap with `fmt.Errorf("op: %w", err)` and match with `errors.Is` or `errors.As`.
- Pass `context.Context` as the first parameter; never store it in a struct; always `defer cancel()`.
- Check every error, including from `Close`, `Write` and `rows.Err()`.
- Give every goroutine an owner and an exit path (context, channel close or `sync.WaitGroup`).
- Set timeouts on `http.Client`, `http.Server` and DB calls; close `resp.Body`.
- Use `exec.CommandContext` with separate arguments; never `sh -c` with interpolated input.
- Use table-driven tests with `t.Run`, `t.Cleanup` and `t.TempDir`; keep `-race` clean.

## Common mistakes

- Capturing a loop variable in a goroutine on a Go version before 1.22.
- Writing to a nil map or comparing an interface holding a nil pointer to nil.
- Ignoring the `ok` result of a type assertion or channel receive.
- Using `time.Sleep` in tests instead of synchronization.
