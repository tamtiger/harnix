# FastAPI engineering guide

## Application architecture and dependency injection

- Structure FastAPI applications into layered modular components: define route endpoints under `api/` or `routers/`, business and domain logic under `services/`, data models and schemas under `schemas/` and `models/`, and cross-cutting concerns under `core/`.
- Use `APIRouter` to group related routes with clear prefixes, tags, and common dependencies. Keep route handlers slim and focused on request parsing, parameter extraction, and invoking domain services.
- Rely on FastAPI's `Depends` dependency injection system for managing database sessions, authentication context, rate limiters, and external client lifecycles. Dependencies must be modular, composable, and easily overridden in unit and integration test fixtures.
- Choose between `async def` and regular `def` deliberately. Use `async def` only when invoking asynchronous non-blocking I/O operations (e.g., async database drivers, HTTP clients like `httpx`). Use standard `def` for synchronous, CPU-bound, or blocking I/O tasks so FastAPI safely offloads them to its internal thread pool.
- Manage application lifecycle and background state using modern lifespan context managers (`@asynccontextmanager`) instead of deprecated `@app.on_event("startup")` and `@app.on_event("shutdown")` hooks.

## Schemas, validation, and data serialization

- Use Pydantic V2 models for strict request validation, response serialization, and auto-generated OpenAPI documentation. Maintain separate schemas for creation (`ItemCreate`), updating (`ItemUpdate`), and responses (`ItemResponse`).
- Leverage Pydantic `Field` to define explicit constraints: value bounds (`ge`, `le`), string length limits (`min_length`, `max_length`), regex patterns, and descriptive examples for OpenAPI specs.
- Enforce schema hygiene with `model_config = ConfigDict(extra="forbid", from_attributes=True)`. Reject unexpected fields in request payloads to prevent accidental mass assignment vulnerabilities.
- Use `response_model` and `response_model_exclude_unset` to guarantee consistent serialization and prevent leaking internal fields, database foreign keys, or hashed passwords in outbound HTTP responses.
- Define custom validators with `@field_validator` and `@model_validator(mode="after")` for cross-field consistency rules. Ensure validation failures raise descriptive `ValueError` exceptions that FastAPI translates into standardized 422 Unprocessable Entity responses.

## Authentication, security, and error handling

- Implement authentication using OAuth2 with Password (and Bearer JWT tokens) or API Key schemes provided by `fastapi.security`. Store secrets securely and sign JWT tokens with strong HMAC-SHA256 or asymmetric RSA/ECDSA keys.
- Enforce authorization checks within dependency providers or domain services rather than scattering manual permission checks across route handlers.
- Handle application exceptions predictably with custom exception classes and global `@app.exception_handler` decorators. Map business errors to standard HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).
- Scrub sensitive internal details from error responses. Never expose raw database errors, SQL queries, or internal stack traces in client-facing JSON payloads.
- Configure CORS (`CORSMiddleware`) with explicit origins, allowed methods, and allowed headers. Avoid using wildcard `allow_origins=["*"]` in production environments handling authenticated credentials.

## Concurrency, testing, and observability

- Optimize database connections using connection pooling (e.g., async SQLAlchemy or SQLModel engine pools). Always ensure database sessions are cleanly closed or rolled back inside `try...finally` blocks or dependency generators.
- Write thorough tests using `pytest` and `httpx.AsyncClient` or `starlette.testclient.TestClient`. Use dependency overrides (`app.dependency_overrides[get_db] = override_get_db`) to replace production databases and external HTTP clients with lightweight test fixtures or in-memory databases.
- Test both successful request paths and validation rejection paths (HTTP 422) to verify boundary constraints and error payloads.
- Implement structured logging (e.g., with `structlog` or standard library logging formatted as JSON) and include request IDs (`X-Request-ID`) across incoming and outgoing logs for distributed tracing.
- Expose standardized health check endpoints (`/healthz`, `/readyz`) and Prometheus metrics without exposing sensitive diagnostic data to unauthenticated callers.
