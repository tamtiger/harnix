# Swift engineering guide

## Value semantics and type safety

- Favor value types (structs and enums) over reference types (classes) by default. Value semantics eliminate unexpected mutation side effects, simplify concurrency analysis, and improve compiler optimization.
- Reserve classes strictly for scenarios requiring reference identity, shared mutable state across independent subsystems, or integration with Objective-C / Apple platform frameworks requiring class inheritance.
- Model domain states and events using enums with associated values. Leverage Swift's pattern matching to handle complex, state-machine-driven workflows safely and exhaustively.
- Restrict force unwrapping (`!`) and force casting (`as!`) completely from production code. Safely unwrap optionals using `guard let`, `if let`, or optional chaining, failing early and explicitly with domain-specific errors.

## Protocol-oriented programming and generics

- Design components around small, highly cohesive protocols rather than monolithic interfaces. Compose rich functionality by extending protocols with default implementations and constrained extensions.
- Use Swift generics with type constraints to create expressive, reusable components without sacrificing static type safety or runtime efficiency.
- Follow the principle of protocol abstraction for external dependencies (network services, persistence stores, hardware sensors), enabling straightforward mock injection during automated testing.
- Mark classes that are not intended for subclassing with `final` to enable direct method dispatch and improve compilation and runtime execution efficiency.

## Modern concurrency (Swift Concurrency)

- Adopt Swift's modern `async/await` concurrency model, actors, and structured concurrency tasks. Avoid legacy completion-handler-based asynchronous APIs and manual GCD dispatch queue juggling in new codebases.
- Isolate shared mutable state within `actor` boundaries to guarantee thread safety and eliminate data races at compile time.
- Use `@MainActor` explicitly on UI components, view models, and state holders that interact directly with main-thread rendering frameworks.
- Respect task cancellation: inspect `Task.isCancelled` and call `Task.checkCancellation()` periodically within intensive asynchronous loops to terminate stale computations cleanly.

## Testing, package management and style

- Manage dependencies and modularize project boundaries using Swift Package Manager (SPM). Keep package manifests (`Package.swift`) declarative, minimal, and cleanly divided into library targets and test targets.
- Structure automated test suites using the modern Swift Testing framework (`@Test`, `#expect`) or `XCTest`. Ensure critical business logic is decoupled from platform frameworks for rapid headless test execution.
- Enforce formatting and style consistency using `swift-format` or `SwiftLint`. Treat compiler warnings as errors in release configurations to prevent creeping code degradation.
