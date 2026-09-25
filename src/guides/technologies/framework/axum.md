# Axum engineering guide

## Application architecture and extractor patterns

- Design Axum web applications leveraging Rust's Tokio runtime and Tower ecosystem. Structure codebases into modular layers: route definitions and handlers (`routes/` or `handlers/`), application domain logic (`services/`), data persistence adapters (`db/` or `repositories/`), and shared application state (`state.rs`).
- Group routes modularly using `Router::new().route(...)` and nest related route hierarchies with `.nest("/api/v1", api_router)`. Keep handlers focused on parameter extraction, invoking domain services, and mapping output responses.
- Master Axum's extractor system. Extractors enforce strict ordering rules: extractors that consume the request body (such as `Json<T>` or `Bytes`) must be placed as the final argument in the handler function signature.
- Manage shared application state safely using `State(state): State<AppState>` with `.with_state(state)`. Encapsulate shared resources (database connection pools, HTTP client instances, configuration parameters) within an immutable, cheap-to-clone struct wrapping `Arc` (e.g., `AppState { pool: PgPool, config: Arc<Config> }`).
- Implement graceful shutdown using `tokio::signal::ctrl_c()` coupled with `axum::serve(listener, app).with_graceful_shutdown(shutdown_signal())` to cleanly drain active HTTP connections during deployments.

## Tower middleware, services, and routing layers

- Integrate standard middleware layers from the `tower-http` crate: apply `TraceLayer::new_for_http()` for structured tracing, `CorsLayer` for Cross-Origin Resource Sharing control, `TimeoutLayer` for enforcing request deadlines, and `CompressionLayer` for automatic response compression.
- Apply middleware layers deliberately. Understand the difference between `.layer()` (runs for every matched route) and `.route_layer()` (runs only for specific routes within a nested router scope).
- Leverage Tower's `Service` abstraction when building custom middleware, or use Axum's high-level helper `middleware::from_fn` for lightweight async middleware functions.
- Manage request size limits defensively: apply `DefaultBodyLimit::max(...)` globally or route-specifically to protect endpoints against oversized payload memory exhaustion and Denial-of-Service attacks.
- Propagate distributed tracing identifiers across incoming and outgoing requests using `SetRequestIdLayer` and `PropagateHeaderLayer`.

## Validation, security, and error handling

- Validate incoming JSON payloads, route parameters, and query strings at the boundary. Combine Axum extractors with validation crates such as `validator` by implementing custom extractors (`struct ValidatedJson<T>(pub T)`) that run `.validate()` automatically before the handler executes.
- Standardize error handling by defining a centralized application error enum (`enum AppError { NotFound, BadRequest(String), Internal(anyhow::Error) }`).
- Implement `IntoResponse` for `AppError`. Convert domain and operational failures into strongly-typed HTTP status codes (`StatusCode::NOT_FOUND`, `StatusCode::BAD_REQUEST`, `StatusCode::INTERNAL_SERVER_ERROR`) with structured JSON error representations (`{ "error": "...", "code": "..." }`).
- Never leak sensitive internal details, database error messages, or SQL connection strings in production error responses. Log the underlying error chain internally using `tracing::error!` and present a sanitized public message to the client.
- Enforce strict security headers (Content Security Policy, X-Content-Type-Options, HSTS) using `tower_http::set_header::SetResponseHeaderLayer`.

## Testing, performance, and concurrency

- Write fast, deterministic integration tests without opening real TCP network sockets by leveraging Tower's `tower::ServiceExt::oneshot(app, request)` API or the `axum-test` crate.
- Construct mock HTTP requests using `http::Request::builder()`, pass them directly to the Axum router, and assert the returned status codes, headers, and deserialized JSON body bytes.
- Isolate the Axum `Router` assembly function (`pub fn app(state: AppState) -> Router`) from the main binary entry point (`main.rs`). This enables unit and integration test suites to instantiate the router with mock states and in-memory databases.
- Offload heavy CPU-bound computations (such as cryptography, image resizing, or large data transformations) outside Tokio async worker threads using `tokio::task::spawn_blocking` to avoid stalling the async event loop.
- Instrument handlers and service layers with `tracing::instrument` to automatically collect spans and timings, integrating seamlessly with OpenTelemetry collectors or Prometheus metric exporters.
