# Express guide

## Verify

```text
node --test
eslint .
tsc --noEmit
npm audit --omit=dev
```

Use the repository's runner and package manager when they differ (`vitest run`, `pnpm audit --prod`).

## Constraints

- Register middleware in order: `helmet()`, body parsers with a `limit`, CORS with an explicit origin allowlist, routes, 404 handler, error handler last.
- Validate `req.body`, `req.params` and `req.query` with a schema (zod, joi) before use.
- Wrap async handlers or use Express 5 (rejected promises reach `next`); never leave a promise unhandled in a route.
- The error handler takes four arguments `(err, req, res, next)`; return no stack traces in production.
- Call `app.disable('x-powered-by')`; set `trust proxy` only to match the real proxy topology.
- Add rate limiting (`express-rate-limit`) on auth and write endpoints.
- Use parameterized queries; never build SQL or shell commands from request data.
- Keep handlers thin: delegate to services; one `express.Router` per resource.
- On `SIGTERM` call `server.close()` and close DB pools before exit.

## Common mistakes

- Sending a response twice (missing `return` after `res.send`).
- Placing the error handler before routes.
- Using `cors()` with no options in production.
- Trusting `req.ip` or `X-Forwarded-For` without `trust proxy`.
- Serving static files from a directory that contains secrets.
