# Java guide

## Verify

```text
mvn -q verify
./gradlew check
```

Use the build tool the repository already has; do not run both.

## Constraints

- Match the Java version in `pom.xml` or the Gradle toolchain; do not use newer language features than it allows.
- Prefer `record` for immutable data and `sealed` types for closed hierarchies when the configured version supports them.
- Never return `null` for a collection; return an empty one. Use `Optional` only for return values, with `orElseThrow()` instead of `get()`.
- Use try-with-resources for every `AutoCloseable`.
- Catch specific exceptions, preserve the cause, and never swallow `InterruptedException` (restore the interrupt flag).
- Use `PreparedStatement` with bound parameters; never concatenate SQL.
- Use `java.time` types and an injected `Clock`; avoid `Date` and `SimpleDateFormat`.
- Compare with `equals`, and override `hashCode` whenever `equals` is overridden.
- Use `ExecutorService` with a bounded pool and shut it down; avoid raw `Thread` creation.
- Test with JUnit 5; do not use `Thread.sleep` for synchronization.

## Common mistakes

- Mutating a collection while iterating it.
- Using `==` on strings or boxed numbers.
- Logging a full exception message that includes secrets or file paths.
- Placing `@Transactional` on private or self-invoked methods.
- Hashing passwords with MD5 or SHA-1 instead of bcrypt or Argon2.
- Returning stack traces, SQL errors or internal paths in API responses instead of mapping exceptions at the handler boundary.
