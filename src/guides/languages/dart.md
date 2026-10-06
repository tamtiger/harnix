# Dart guide

## Verify

```text
dart format --output=none --set-exit-if-changed .
dart analyze
dart test
```

## Constraints

- Do not use `!` without a preceding check or documented invariant.
- Declare fields `final` and constructors `const` where possible.
- Use `dynamic` only at JSON boundaries and parse into typed models immediately.
- Use sealed classes, records and exhaustive `switch` for variants.
- Catch specific exception types; never a bare `catch (e)` or an `Error` subtype.
- `await` every Future or wrap it in `unawaited(...)`; enable `unawaited_futures`.
- Check `context.mounted` (Flutter) or `mounted` after every `await` before using context or `setState`.
- Close `StreamController`s and cancel `StreamSubscription`s and `Timer`s in `dispose`/`close`.
- Enable `avoid_print`, `prefer_const_constructors` and `always_declare_return_types` in `analysis_options.yaml`.
- Use `https://` only, set timeouts on every HTTP client, and keep tokens in `flutter_secure_storage`, never `SharedPreferences`.

## Common mistakes

- Listening to a single-subscription stream twice.
- Using `print` instead of a logger.
- Putting business logic inside widgets.
- Using `catchError` with a handler of the wrong return type.
- Forgetting to cancel a `Timer` on dispose.
- Hand-editing generated files (`*.g.dart`, `*.freezed.dart`) instead of rerunning `build_runner`.
