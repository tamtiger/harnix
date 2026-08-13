# PHP engineering guide

## Structure and contracts

- Follow Composer autoloading and the project's namespace layout. Keep request handling, domain rules, persistence, templates, and infrastructure adapters separate so that business behavior can be tested without a web server.
- Use strict, explicit parameter and return types where the supported PHP version and repository conventions allow. Model optional values intentionally; do not use loose comparisons or falsey values to encode several unrelated states.
- Keep configuration in documented environment/configuration layers. Validate required configuration at startup and do not read secrets or mutable environment state throughout domain code.

## Input, database, and output security

- Validate request shape and authorization before invoking domain work. Validation determines acceptable data; authorization determines whether this actor may perform the operation.
- Use PDO/query-builder parameter binding for all values in SQL. Never interpolate untrusted strings into SQL identifiers, shell commands, file paths, or template fragments; whitelist non-parameterizable identifiers such as sort columns.
- Hash passwords with the platform password API and verify them with its paired verification function; never invent a password hash, store plaintext, or compare secret values with ordinary string equality.
- Escape output for the target context and use the framework/template engine's escaping defaults. HTML escaping does not make a string safe for JavaScript, URLs, CSS, or shell arguments.
- Treat uploads, redirects, deserialization, and filesystem paths as security boundaries. Use server-generated names, validate content and size, and resolve paths under an intended root.

## Errors and resources

- Convert expected application failures into explicit HTTP/domain outcomes; log unexpected failures with a correlation identifier and safe context. Do not expose stack traces, SQL, or credentials to users.
- Close or release resources predictably through the library/framework lifecycle. Bound remote calls with timeouts and make retries idempotent.
- Avoid mutable request globals in business services. Pass the request-derived values needed by the use case as parameters or typed command objects.

## Testing and delivery

- Use the project's PHPUnit/Pest conventions and isolate databases, filesystem paths, sessions, and queues per test. Assert authorization, validation, redirect/error responses, and persisted state.
- Run Composer's locked dependency and static-analysis commands when configured. Do not upgrade dependencies as an incidental part of a feature change.
