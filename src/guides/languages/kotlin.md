# Kotlin guide

## Verify

```text
./gradlew check
./gradlew ktlintCheck
./gradlew detekt
```

## Constraints

- Do not use `!!` in production code; use `?.`, `?:` or `requireNotNull(x) { "message" }`.
- Declare properties `val` by default; use `data class` for immutable models.
- Model closed hierarchies as `sealed interface` and make every `when` exhaustive without `else`.
- Never use `GlobalScope`; launch from a lifecycle-bound `CoroutineScope`.
- Use `Dispatchers.IO` for blocking I/O and `Dispatchers.Default` for CPU work.
- Rethrow `CancellationException`; call `ensureActive()` in long loops.
- Test coroutines with `runTest` from `kotlinx-coroutines-test`.
- Wrap Java platform types (`T!`) with explicit nullability at the boundary.
- Use HTTPS only, set connect/read timeouts on every HTTP client, and bind Room/SQLDelight parameters; never concatenate SQL.
- On Android, store tokens in `EncryptedSharedPreferences` or the Keystore, never plain `SharedPreferences`; keep R8 rules for `@Serializable` and reflection models and test the release build.

## Common mistakes

- Catching `Exception`/`Throwable` or wrapping suspend calls in `runCatching`, which swallows `CancellationException`.
- Nesting scope functions (`let`, `run`, `apply`) until `it` and `this` are ambiguous.
- Exposing `MutableStateFlow` publicly instead of `StateFlow`.
- Leaving classes `open` without a design for inheritance.
- Running ktlint or detekt tasks that the build does not configure.
