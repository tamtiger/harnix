# Rust guide

## Verify

```text
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

## Constraints

- Put a `// SAFETY:` comment stating the invariant on every `unsafe` block.
- Return `Result<T, E>`; use `panic!` only for broken invariants.
- Do not use `unwrap()` in production code; use `?` or `expect("context")`.
- Use `thiserror` enums for library errors and `anyhow` only in binaries.
- Wrap ids in newtypes (`UserId(u64)`) so arguments cannot be swapped.
- Never hold a `Mutex` or `RwLock` guard across `.await`.
- Run blocking I/O in async code through `tokio::task::spawn_blocking`.
- Borrow (`&T`) instead of `.clone()` in hot paths.
- Enable only the Cargo features a dependency needs (`default-features = false`).
- Keep unit tests in `#[cfg(test)] mod tests` and public API tests under `tests/`.

## Common mistakes

- Using `Rc<RefCell<T>>` where ownership or channels would do.
- Calling `std::thread::sleep` inside an async task.
- Ignoring a `#[must_use]` result with `let _ =`.
- Indexing slices (`v[i]`) on untrusted input instead of `.get(i)`.
- Adding `#[allow(...)]` to silence clippy without a reason.
