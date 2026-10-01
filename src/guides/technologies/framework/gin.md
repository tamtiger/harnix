# Gin guide

## Verify

```text
go vet ./...
staticcheck ./...
go test -race ./...
```

## Constraints

- Build the engine with `gin.New()` plus explicit `gin.Recovery()` and a logger; avoid `gin.Default()` in services.
- Bind with `c.ShouldBindJSON`, `ShouldBindQuery` or `ShouldBindUri`; never `c.BindJSON` (it writes 400 and aborts).
- Declare `binding:"required,min=..,max=.."` tags on request structs; use pointer fields to tell omitted from zero.
- Return response DTO structs, never domain or DB models.
- Pass `c.Request.Context()` and plain values down; never pass `*gin.Context` to services or repositories.
- Use `c.Copy()` before handing the context to a goroutine that outlives the handler.
- Wrap bodies with `http.MaxBytesReader`; set explicit CORS origins.
- Return one `APIError` shape; record failures with `c.Error(err)` and `c.AbortWithStatusJSON`.
- Run `http.Server` with `Shutdown(ctx)` on SIGTERM and set `ReadHeaderTimeout`.
- Call `gin.SetMode(gin.TestMode)` and test with `httptest.NewRecorder`.

## Common mistakes

- Continuing a handler after an error without `return` or `Abort`.
- Applying auth middleware globally instead of on the route `Group`.
- Registering middleware after the routes it must protect.
- Trusting all proxies; call `SetTrustedProxies`.
