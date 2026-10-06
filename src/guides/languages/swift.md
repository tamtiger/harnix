# Swift guide

## Verify

```text
swift build
swift test
swiftlint
```

## Constraints

- Do not use `!` or `as!` in production code; use `guard let`, `if let` or `as?`.
- Prefer `struct` and `enum` with associated values; use `class` only for reference identity.
- Mark classes not meant for subclassing `final`.
- Protect shared mutable state with an `actor`.
- Annotate UI types and view models with `@MainActor`.
- Use `async`/`await` and structured tasks; do not add completion-handler or manual GCD code in new APIs.
- Call `try Task.checkCancellation()` in long async loops.
- Hide external dependencies behind small protocols so tests can inject fakes.
- Enable strict concurrency checking (Swift 6 language mode).
- Store tokens and keys in the Keychain, never `UserDefaults` or source; do not disable App Transport Security.

## Common mistakes

- Capturing `self` strongly in an escaping closure without `[weak self]`.
- Using `Task.detached` where a child task would inherit cancellation.
- Updating UI state off the main actor.
- Passing non-`Sendable` types across actor boundaries.
- Using `try!` to silence an error.
- Logging with `print()` instead of `os.Logger`.
