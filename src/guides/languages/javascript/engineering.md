# JavaScript engineering guide

## Modules and data boundaries

- Use the module system and runtime conventions already selected by the repository. Do not mix CommonJS and ESM semantics casually; package metadata and file extensions are part of runtime behavior.
- Treat parsed JSON, environment variables, browser events, database rows, and third-party responses as unknown until validated. JavaScript has no runtime type checking from annotations or documentation.
- Keep modules small and explicit about side effects. Avoid import-time network calls, filesystem writes, mutable singletons, and hidden configuration reads that make ordering matter.
- Prefer immutable updates for shared state. Clone or derive new structures rather than mutating caller-owned objects unless mutation is the documented contract.

## Async and failures

- Always `await` or deliberately return promises. Make rejection paths observable; unhandled promises can turn an expected failure into process-wide noise or a silent lost operation.
- Use `AbortSignal` and timeouts for cancellable network or long-running work when the platform supports them. Propagate cancellation rather than starting detached work without an owner.
- Add contextual error information at the boundary that understands the operation. Preserve causal errors where the runtime supports it, and never expose secrets in messages or logs.
- Do not use `catch` to silently return a default unless that fallback is an intentional, tested product behavior.

## Web and server safety

- Parameterize queries; do not build SQL, shell commands, file paths, HTML, or dynamic code by concatenating untrusted values.
- Validate authorization independently of client-side UI state. Encode output for HTML, URL, JavaScript, or CSS contexts through the relevant safe API.
- Keep environment configuration explicit and validate it once on startup. Make missing or invalid required configuration fail fast with a non-secret diagnostic.

## Tests and tooling

- Use the repository formatter, linter, and test runner rather than introducing overlapping tooling without a clear migration.
- Test visible behavior and failure paths with deterministic time, randomness, filesystem roots, and clients. Restore global state in test cleanup when a legacy API requires it.
- Keep tests close to the public module contract; mock only true external boundaries. Use integration tests for real serialization, routing, persistence, or bundler behavior.
