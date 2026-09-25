# Kotlin engineering guide

## Null safety and type contracts

- Leverage Kotlin's first-class null-safety system as an inviolable contract. Never use the not-null assertion operator (`!!`) in production code; handle nullable values through safe calls (`?.`), elvis operators (`?:`), or structured smart casting.
- Explicitly model presence and absence through nullable types rather than sentinel objects or magic numbers. When working with Java interop boundaries, immediately wrap platform types (`T!`) with explicit nullability contracts and validation.
- Prefer data classes for immutable transport objects, domain models, and values. Use `val` by default for all class properties; restrict `var` to localized, transient mutable state within encapsulated class boundaries.
- Employ sealed classes and sealed interfaces for closed algebraic data types (ADTs). Combine sealed hierarchies with exhaustive `when` expressions without `else` branches to guarantee compiler-enforced handling of new variations.

## Idiomatic functional and object-oriented design

- Maximize the power of extension functions to keep core domain entities focused and clean, moving specialized transformation and formatting logic to peripheral extension utilities.
- Use Kotlin's standard scope functions (`apply`, `let`, `run`, `also`, `with`) with disciplined purpose. Avoid nested or ambiguous scope functions that obfuscate `this` and `it` references.
- Prefer composition over inheritance. When class extension is genuinely necessary, ensure open classes and methods are explicitly marked `open` and follow the principle of designing for inheritance or forbidding it.
- Keep collection transformations lazy and efficient: use standard collection operations for small collections and transition to `Sequence` when processing large or streaming data pipelines to avoid intermediate allocations.

## Coroutines and structured concurrency

- Enforce structured concurrency across all asynchronous flows. Never launch coroutines into unrestricted global scopes like `GlobalScope`; bind all background work to a supervised `CoroutineScope` tied to an explicit lifecycle.
- Differentiate dispatchers with care: utilize `Dispatchers.Default` for CPU-bound computations, `Dispatchers.IO` for blocking network and disk operations, and domain-appropriate dispatchers for UI or actor threads.
- Handle coroutine cancellation cooperatively. Ensure long-running loops frequently verify active state using `yield()` or `ensureActive()`, and preserve `CancellationException` without catching and swallowing it into generic error handlers.
- Model asynchronous data streams with Kotlin `Flow`. Prefer cold flows for on-demand data computation and `StateFlow` or `SharedFlow` for reactive state observation and event broadcasting.

## Testing and ecosystem conventions

- Structure tests around Kotest or JUnit 5 with MockK for idiomatic Kotlin mocking. Write expressive, descriptive test method names backtick-quoted when testing behavior (e.g., ``test invalid payment returns 400 bad request``).
- Use `runTest` from `kotlinx-coroutines-test` for reliable, deterministic coroutine testing with virtual time control.
- Enforce strict static analysis using `ktlint` and `detekt`. Keep Gradle build logic clean, modern, and type-safe using Kotlin DSL (`build.gradle.kts`) with convention plugins and dependency version catalogs.
