# TypeScript engineering guide

## Compiler and module contracts

- Keep the repository's strict compiler configuration enabled. Treat type errors as a design signal; do not use `any`, unchecked assertions, or suppression comments to bypass an uncertain contract.
- Align `module`, module resolution, file extensions, and package metadata with the actual runtime. TypeScript's emitted module behavior and Node/bundler resolution are part of the executable contract.
- Use `unknown` at untrusted boundaries, narrow it with validators/type guards, and convert it into named domain types. Types disappear at runtime, so a TypeScript interface alone does not validate JSON or environment variables.
- Model optionality, discriminated outcomes, and error states explicitly. Prefer narrow unions and exhaustive handling to booleans or loosely shaped objects that allow contradictory states.

## API and implementation design

- Keep transport DTOs, domain values, persistence records, and third-party payloads distinct when their invariants differ. Map between them deliberately rather than spreading external fields into internal models.
- Prefer readonly inputs and immutable updates for shared state. Avoid global mutable caches or module-level configuration unless their lifecycle, invalidation, and test isolation are explicit.
- Use dependency injection for clocks, process runners, filesystem roots, and remote clients where deterministic testing matters. Do not concatenate untrusted values into shell commands or paths.
- Preserve error causes when translating failures. Make asynchronous rejection and cancellation behavior part of the public contract rather than an accidental implementation detail.

## Tests and tooling

- Use the configured formatter, lint rules, test framework, and build command. Avoid duplicate type configurations that compile different source sets unless the project intentionally publishes multiple targets.
- Test observable contracts with deterministic fixtures. Include malformed payloads, authorization failures, duplicate requests, and cancellation for boundary-heavy code.
- Prefer `satisfies`, type predicates, and compile-time tests only as supplements to runtime behavior tests. A successful typecheck cannot prove a JSON parser, database query, or authorization middleware works.
