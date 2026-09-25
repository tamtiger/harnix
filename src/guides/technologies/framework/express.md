# Express.js engineering guide

## Application architecture and middleware pipeline

- Structure Express applications into clear architectural layers: route handlers (`routes/`), business controllers (`controllers/`), domain services (`services/`), data access repositories (`repositories/`), and shared middlewares (`middlewares/`). Avoid embedding database queries or business algorithms directly inside route definitions.
- Compose routes modularly using `express.Router()`. Mount feature routers with explicit URL prefixes in the main app file (`app.use('/api/v1/orders', orderRouter)`).
- Understand middleware ordering in the pipeline. Place foundational security, parsing, and logging middlewares before route handlers. Place 404 route fallthrough handlers and centralized error-handling middlewares at the very end of the pipeline.
- Avoid modifying the shared `req` or `res` objects with untyped ad-hoc properties. When passing contextual data (such as authenticated user tokens or trace IDs), define explicit TypeScript declarations via declaration merging (`declare global { namespace Express { interface Request { ... } } }`).
- Implement robust graceful shutdown procedures (`SIGTERM`, `SIGINT`). Close HTTP listener connections, drain active requests, and shut down database connection pools and message brokers cleanly before exiting the process.

## Validation, security, and sanitization

- Always validate and sanitize incoming request bodies, route parameters, and query strings at the middleware boundary using schema validation libraries such as Zod or Joi. Do not proceed to service execution if validation fails; return structured HTTP 400 Bad Request responses.
- Enforce standard HTTP security headers using `helmet()`. Configure Content Security Policy (CSP), disable `X-Powered-By: Express` header, and enforce strict HSTS policies.
- Protect against Cross-Origin Resource Sharing (CORS) exploits using the `cors` package. Explicitly whitelist trusted frontend domains, HTTP methods, and allowed headers; avoid wildcards in production endpoints handling cookies or bearer tokens.
- Mitigate Denial-of-Service (DoS) and brute-force attacks by integrating rate limiters (e.g., `express-rate-limit` backed by Redis) on authentication and high-cost compute routes.
- Prevent HTTP Parameter Pollution (HPP) and Prototype Pollution by sanitizing incoming request payloads and avoiding recursive shallow object merges from untrusted input.

## Error handling, async safety, and logging

- Implement centralized error-handling middleware with the mandatory four-argument signature: `(err, req, res, next)`. Any error handler missing `next` or having fewer than four arguments will fail to catch Express errors properly.
- Ensure all asynchronous route handlers and middlewares catch rejected promises. In Express 4, unhandled promise rejections bypass the error middleware and crash the process unless wrapped in a helper (`asyncHandler(async (req, res, next) => { ... })`) or using Express 5's native async error handling.
- Differentiate between operational errors (validation failures, not found, forbidden) and programmer errors (syntax bugs, unhandled null pointers). Return clean, sanitized JSON error responses for operational issues.
- Never expose internal database error details, query text, or stack traces in production error responses. Log the full error context and stack trace server-side using structured loggers like Pino or Winston.
- Assign a unique correlation ID (`X-Request-Id`) to every incoming request via middleware and propagate it across all service logs to enable end-to-end request tracing.

## Performance, testing, and lifecycle

- Use connection pooling for databases (e.g., `pg`, `mysql2`, or Mongoose pools). Always release connections back to the pool in `finally` blocks or via ORM transaction abstractions.
- Keep the Node.js event loop unblocked. Never perform CPU-intensive synchronous operations (heavy encryption, large JSON parsing, image manipulation) directly on the main event loop thread; offload them to Worker Threads or dedicated microservices.
- Write fast, deterministic integration tests for routes using `supertest` paired with Jest or Vitest. Test HTTP status codes, response headers, validation failure payloads, and authentication guards.
- Isolate the Express `app` declaration (`app.js` or `app.ts`) from the HTTP server listening call (`server.listen()` in `index.ts`). This allows test suites to import the app and run HTTP tests via `supertest` without binding to live network ports.
- Expose standardized health check endpoints (`/healthz` for liveness, `/readyz` for readiness) to verify that database and cache dependencies are fully connected before routing production traffic.
