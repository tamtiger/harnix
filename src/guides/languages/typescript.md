# TypeScript engineering guide

## Compiler configuration, module resolution, and type hygiene

- Keep strict compiler flags enabled at all times: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, `"noUncheckedIndexedAccess": true`, and `"exactOptionalPropertyTypes": true`. Treat type errors as architectural feedback; never use `any`, unchecked type assertions (`as unknown as T`), or `@ts-ignore` to suppress uncertain contracts.
- Align `module` and `moduleResolution` settings directly with the execution target. For modern Node.js and browser environments, use `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`, enforcing explicit `.js` extension specifiers in relative ESM import statements.
- Distinguish between compile-time types and runtime boundaries. TypeScript types vanish at runtime; never assume that an `interface` or `type` alias protects an endpoint from malformed HTTP payloads, invalid database rows, or missing environment variables.
- Model optionality, failure paths, and state transitions using Discriminated Unions with a literal `kind` or `type` discriminant. Enforce exhaustive handling with `assertNever(value: never): never` in `switch` and `if/else` ladders so compiler errors surface when new variants are added.
- Use `satisfies` to enforce type conformity while preserving specific literal inferences, rather than widening object properties via explicit type annotations.

## Domain architecture and data modeling

- Maintain clean separation between transport DTOs, domain models, database persistence entities, and external third-party API payloads. Map between these layers deliberately using pure transformation functions; do not let external schema changes cascade through internal domain logic.
- Prefer immutability and readonly properties: annotate objects, collections, and tuples with `readonly`, `Readonly<T>`, and `ReadonlyArray<T>`. Prevent in-place mutation of shared collections; use immutable transformations (`map`, `filter`, array spreading) or utility libraries.
- Avoid global mutable singleton state, ambient service locators, or implicit module-level configuration. Use explicit constructor or factory dependency injection for clocks, filesystem wrappers, loggers, and external network clients to enable deterministic testing.
- Design domain errors as structured classes extending `Error` (e.g., `DomainError`, `NotFoundError`, `ConflictError`). Capture the underlying causal error using `Error.cause` to retain full operational debugging context across asynchronous stack traces.
- Treat nullability explicitly: differentiate between `undefined` (value omitted or not provided) and `null` (value explicitly empty or reset). Avoid mixing them arbitrarily across API contracts.

## Runtime boundary validation and defensive programming

- Validate all untrusted input at the boundary using schema validation libraries such as Zod, Valibot, or ArkType. Parse raw `unknown` inputs into strongly-typed domain records immediately upon entry.
- Implement custom user-defined type predicates (`value is TargetType`) only when standard schema parsers are impractical. Ensure type guard predicates perform exhaustive structural validation before returning `true`.
- Enforce strict prototype pollution defense: reject `__proto__`, `constructor`, and `prototype` keys when merging or parsing dynamic configuration objects.
- Validate configuration and environment variables on application startup. Crash fast with descriptive configuration errors if required variables are missing or fail format validation, rather than failing silently halfway through runtime execution.
- Prevent Cross-Site Scripting (XSS) and command injection: never format raw strings directly into SQL queries, child process execution arguments, regular expression constructors (`RegExp`), or HTML templates without context-appropriate sanitization and parameterization.

## Testing, tooling, and performance

- Configure test runners (Vitest or Jest) with native ESM support and source map resolution. Test observable behaviors and boundary contracts rather than verifying internal private methods or implementation details.
- Provide deterministic test fixtures and mock interfaces for external services, database pools, and clocks. Test both the primary happy paths and unhappy boundary paths: network timeouts, malformed payloads, unauthorized states, and concurrent race conditions.
- Leverage compile-time type testing (using `expectTypeOf` in Vitest or `tsd`) for complex generic utilities, conditional types, and library APIs alongside standard runtime behavioral assertions.
- Minimize bundling bloat: avoid importing large monolithic libraries when tree-shakeable modular imports are available. Prefer `import type { ... }` for type-only imports to eliminate unnecessary runtime module evaluations and circular dependency cycles.
- Enforce automated linting and formatting via ESLint (with `@typescript-eslint` recommended type-checked rulesets) and Prettier. Keep lint configurations strict in CI/CD pipelines to prevent code rot and style inconsistencies.
