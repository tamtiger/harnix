# Gin engineering guide

## Application architecture and routing

- Structure Gin web services following idiomatic Go patterns: separate HTTP transport handlers (`internal/handler/`), business services (`internal/service/`), persistence layers (`internal/repository/`), and domain models (`internal/domain/`). Keep handlers strictly transport-focused.
- Group related routes logically using `router.Group("/api/v1")`. Apply group-level middlewares (authentication, rate-limiting, CORS) selectively to specific route groups rather than globally to the entire engine.
- Initialize the Gin engine deliberately. Use `gin.New()` instead of `gin.Default()` in production services to have explicit control over attached middlewares (`gin.Recovery()`, custom structured logging).
- Keep handler signatures standard: `func(c *gin.Context)`. Do not leak `*gin.Context` into lower service or repository layers; extract required values (user IDs, query parameters, request context `c.Request.Context()`) and pass standard Go types or standard `context.Context` down the stack.
- Manage service startup and graceful shutdown using `http.Server` with `server.Shutdown(ctx)` listening for `os.Interrupt` and `syscall.SIGTERM` signals. Ensure in-flight requests finish cleanly before releasing database pools.

## Binding, validation, and serialization

- Validate incoming requests using Gin's model binding methods: `c.ShouldBindJSON()`, `c.ShouldBindQuery()`, or `c.ShouldBindUri()`. Avoid using `c.BindJSON()` because it automatically writes a 400 error response and aborts the request, preventing custom structured error formatting.
- Annotate request struct fields with binding tags: `json:"name" binding:"required,min=3,max=50"`. Leverage Go's `go-playground/validator` tags for strict data validation at the HTTP boundary.
- For optional fields with zero-values, use pointer types (`*string`, `*int`) or custom null types in request structs to distinguish between an omitted field and an explicitly provided zero/false value.
- Serialize outbound responses using `c.JSON(http.StatusOK, responsePayload)`. Define clear, strongly-typed response DTO structs to avoid accidental exposure of internal database fields, unhashed passwords, or internal IDs.
- For streaming responses, file downloads, or server-sent events, use `c.Stream()` or `c.Data()` while respecting context cancellation signals to avoid leaking goroutines.

## Middleware, security, and error handling

- Always include a panic recovery middleware (`gin.Recovery()` or a custom recovery handler) in the middleware stack. Ensure that unexpected panics in handlers recover cleanly, write an HTTP 500 status code, and log the stack trace without crashing the entire service process.
- Implement structured logging middleware using high-performance loggers such as `zap` or `zerolog`. Capture latency, client IP, HTTP method, path, response status, and correlation ID (`X-Request-ID`) on every completed request.
- Defend against common web vulnerabilities: configure CORS policies with explicit origins and headers, set security headers (`X-Frame-Options`, `X-Content-Type-Options`), and configure request body size limits (`http.MaxBytesReader`) to mitigate Denial-of-Service attacks.
- Standardize API error responses across the entire application using a unified error struct (`type APIError struct { Code string; Message string; Details []string }`).
- Store contextual errors using `c.Error(err)` within handlers so downstream logging middlewares can inspect and record operational failure reasons.

## Concurrency, testing, and observability

- Beware of asynchronous goroutines inside Gin handlers: never pass `*gin.Context` directly into a newly spawned goroutine. If a goroutine must run after the handler returns, create a copy using `c.Copy()` or pass down the cancellation context `c.Request.Context()`.
- Write fast, isolated unit and integration tests using Go's standard `net/http/httptest` package. Use `httptest.NewRecorder()` to capture handler responses and verify status codes, headers, and JSON body payloads without opening live network sockets.
- Set `gin.SetMode(gin.TestMode)` in test setup to suppress superfluous terminal logging during automated test runs.
- Mock downstream dependencies (services and repositories) using interface abstraction and Go mock generators (e.g., `mockery` or hand-crafted fake implementations).
- Expose standardized health check endpoints (`/healthz` and `/readyz`) that verify database ping responses, message broker heartbeats, and disk health before marking the service instance ready in container orchestration environments.
