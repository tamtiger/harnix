# NestJS engineering guide

## Module architecture, provider scoping, and Dependency Injection

- Design NestJS applications around highly cohesive, loosely coupled feature modules (`@Module`). Each feature module should encapsulate its controllers, services, repositories, and entities, exporting only the public service interfaces that other modules explicitly require.
- Avoid creating monolithic "God modules" or making all modules global (`@Global()`). Global modules obscure dependency graphs and make testing brittle; favor explicit module imports and bounded dependency declarations.
- Keep Controllers strictly transport-focused: parse incoming HTTP requests, extract parameters, call domain services, and return typed responses. Never embed database queries, transactions, or complex business logic directly inside controller handlers.
- Understand provider injection scopes: use the default `Scope.DEFAULT` (Singleton) for all stateless services and database repositories to maximize performance and avoid per-request memory allocation overhead. Use `Scope.REQUEST` only when request-scoped contextual state (e.g., multi-tenant routing) is unavoidable, and beware of its transitive performance impact across the dependency graph.
- Avoid circular dependencies between modules and providers: resolve legacy circularities using `forwardRef()` only as a temporary stepping stone while refactoring towards an event-driven architecture or intermediary service abstraction.

## Validation, DTOs, and serialization

- Validate all incoming network payloads at the HTTP boundary using a globally configured `ValidationPipe` (in `main.ts` or app module): configure `whitelist: true` (stripping unwhitelisted properties), `forbidNonWhitelisted: true` (rejecting unexpected properties to prevent mass assignment vulnerabilities), and `transform: true` (automatically casting incoming primitive strings to typed DTO classes).
- Define DTOs (Data Transfer Objects) as classes decorated with `class-validator` and `class-transformer` annotations. Maintain separate, explicit DTO classes for creation (`CreateUserDto`), updating (`UpdateUserDto`), and queries (`FindUsersQueryDto`).
- Enforce strict response serialization using `ClassSerializerInterceptor` combined with `@Exclude()` on sensitive entity properties (such as password hashes, secret keys, or internal database metadata) to prevent data leakage in HTTP responses.
- Manage application configuration safely using `@nestjs/config` with Joi, Zod, or class-validator validation schemas. Validate all required environment variables upon application bootstrap and inject typed configuration services rather than accessing `process.env` directly in providers.
- Handle asynchronous file uploads using streaming or dedicated interceptors (`FileInterceptor`) with explicit file size, MIME-type, and extension validation to protect against malicious uploads.

## Security, authentication, and error hygiene

- Implement authentication and authorization using NestJS Guards (`CanActivate`). Extract user tokens in an `AuthGuard` (e.g., using `@nestjs/passport` with JWT strategy), attach the authenticated user context to the request object, and enforce fine-grained role or permission checks via custom metadata decorators (`@Roles()`, `@Permissions()`) and matching authorization guards.
- Standardize error handling and exception mapping using custom Exception Filters (`@Catch()`). Catch domain exceptions and map them cleanly to standard HTTP status codes (`NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`).
- Sanitize error responses in production: ensure exception filters suppress internal stack traces, database driver connection strings, and raw SQL queries from client-facing JSON payloads.
- Apply global security middlewares in `main.ts`: enable `helmet()` for standard security headers, configure CORS with explicit origin whitelists, and enforce rate-limiting via `@nestjs/throttler` across authentication endpoints.
- Prevent Cross-Site Request Forgery (CSRF) on session-based endpoints using `csurf` or cookie-based CSRF mitigation tokens.

## Testing, observability, and lifecycle

- Write fast, deterministic unit tests for providers by instantiating them as pure classes or using `@nestjs/testing`'s `Test.createTestingModule()`. Mock external database repositories, HTTP clients, and message queues using custom provider mocks (`useValue` or `useFactory`).
- Implement end-to-end (E2E) integration tests using `supertest` against the compiled Nest application instance. Test HTTP status codes, validation pipe rejection outcomes (HTTP 400), guard authentication rejections (HTTP 401/403), and correct JSON response structures.
- Implement graceful shutdown hooks by calling `app.enableShutdownHooks()` in `main.ts`. Handle `OnApplicationShutdown` and `BeforeApplicationShutdown` in database connection pools, queue consumers, and microservice clients to drain active requests before process exit.
- Offload long-running background tasks, image processing, and external webhook deliveries to background queues using BullMQ (`@nestjs/bullmq`) backed by Redis.
- Implement structured logging with NestJS custom loggers (wrapping Pino or Winston). Emit structured JSON log records containing correlation IDs (`X-Request-Id`) across HTTP requests, microservice messages, and queue job handlers.
