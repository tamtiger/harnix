# Python engineering guide

## Modules, types, and state

- Keep modules focused and import-safe: importing a module should define code, not start work, mutate production state, or contact a network service.
- Use type hints on public functions, data-transfer objects, and non-obvious internal contracts. Treat them as design documentation backed by the configured type checker; validate untrusted runtime input separately.
- Prefer immutable values or well-contained mutation. Avoid default mutable arguments, hidden module globals, and ambient context that makes tests order-dependent.
- Use `pathlib` and explicit encodings for filesystem work where they clarify intent. Normalize and validate paths before operating on user-controlled locations.

## Exceptions, resources, and async work

- Raise precise exceptions at the layer that understands the failure, and catch them only where the program can recover, translate, or add useful safe context. Do not catch broad `Exception` merely to continue.
- Use context managers for files, locks, connections, and temporary resources. Ensure cleanup happens when parsing or processing fails.
- Keep synchronous and asynchronous boundaries explicit. Do not call blocking I/O inside an async request path without a deliberate executor/adapter, and propagate cancellation/timeouts to clients that support them.
- Make retry behavior bounded and idempotency-aware. A retryable read and a retryable payment write are not the same operation.

## Data and security

- Parse external data into validated domain objects at the boundary. Avoid passing loose dictionaries through multiple layers when an object with invariants is clearer.
- Use parameterized database interfaces, safe subprocess argument arrays, and target-context output encoding. Never use `eval`, shell interpolation, or unsafe deserialization on untrusted data.
- Keep secrets out of code and logs. Validate required settings early, distinguish a developer misconfiguration from a user-facing failure, and redact sensitive fields in diagnostics.

## Tests and tooling

- Follow the repository's formatter, linter, test, and packaging configuration. Keep virtual environments and generated build output outside source control unless the project explicitly requires them.
- Write tests around observable behavior with fixtures for filesystem, time, environment, and HTTP. Use temporary paths and fake clients rather than a developer machine or real network.
- Add regression coverage for parsing and boundary validation, including malformed and missing fields; use property/fuzz testing when the project already supports it and parsers have high input variety.
