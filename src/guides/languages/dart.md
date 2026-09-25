# Dart engineering guide

## Sound null safety and type design

- Leverage Dart's sound null-safety type system to eliminate null-dereference errors at compile time. Never use the null assertion operator (`!`) without an explicit runtime invariant assertion or defensive fallback.
- Prefer immutable data structures. Declare class properties as `final` by default, and provide `const` constructors for widgets, value objects, and configuration classes to optimize memory allocation and enable framework caching.
- Restrict dynamic typing (`dynamic`) strictly to untrusted deserialization boundaries. Immediately validate and parse incoming dynamic payloads (such as JSON) into strongly typed data models with type-safe field accessors.
- Use pattern matching, records, and sealed classes (introduced in modern Dart) to express algebraic data types and complex conditional state dispatch cleanly and exhaustively.

## Idiomatic programming and architecture

- Maintain a clean, layered architectural boundary separating presentation, domain business logic, and infrastructure/data sources. Avoid coupling business rules directly to framework-specific widgets or device drivers.
- Use extension methods to enrich external classes and utility types cleanly without polluting domain classes with presentation-specific transformations.
- Handle exceptions with precision: catch specific exception types instead of generic `catch (e)` blocks. Provide meaningful domain error abstractions and propagate failure states through functional constructs (e.g., Result/Either types) or typed exceptions.
- Manage resource lifecycles carefully: ensure streams, controllers, timers, and client connections are explicitly closed or cancelled in disposal hooks to prevent memory and thread leaks.

## Asynchronous programming with Futures and Streams

- Write clean, sequential asynchronous code using `async` and `await`. Avoid unhandled Future rejections by always awaiting asynchronous operations or chaining comprehensive `catchError` handlers.
- Use `Stream` for continuous, reactive event pipelines. Prefer broadcast streams for multi-listener event buses and single-subscription streams for sequential data downloads or file reading.
- Guard against race conditions when updating shared state across asynchronous gaps. Always verify whether the execution context remains mounted or valid after an `await` call before updating UI or persistent state.

## Testing, static analysis and tooling

- Organize tests under the `test/` directory mirroring the `lib/` file hierarchy. Write unit tests with the standard `test` package, and write widget/integration tests using framework testing harnesses.
- Configure strict analysis options in `analysis_options.yaml`, enabling lints such as `avoid_print`, `prefer_const_constructors`, `unawaited_futures`, and `always_declare_return_types`.
- Format all codebase files with `dart format` and verify clean static analysis using `dart analyze` before submitting code changes.
