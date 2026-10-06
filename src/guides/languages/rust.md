# Rust guide

## Verify

```text
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

Also run `cargo audit` and `cargo deny check` when the repository configures them.

## Constraints

- Put a `// SAFETY:` comment stating the invariant on every `unsafe` block; never use `unsafe` to bypass the borrow checker.
- Return `Result<T, E>`; use `panic!` only for broken invariants.
- Do not use `unwrap()` in production code; use `?`, and keep `expect("invariant")` only for proven invariants.
- Use `thiserror` enums for library errors and `anyhow` only in binaries.
- Wrap ids in newtypes (`UserId(u64)`) so arguments cannot be swapped.
- Never hold a `Mutex` or `RwLock` guard across `.await`.
- Run blocking I/O in async code through `tokio::task::spawn_blocking`.
- Borrow (`&T`, `&str`, `&[T]`) by default; never clone just to satisfy the borrow checker.
- Enable only the Cargo features a dependency needs (`default-features = false`).
- Default items to private; use `pub(crate)` for internal sharing and `pub` only for the public API.

## Common mistakes

- Using `Rc<RefCell<T>>` where ownership or channels would do.
- Calling `std::thread::sleep` inside an async task.
- Ignoring a `#[must_use]` result with `let _ =`.
- Indexing slices (`v[i]`) on untrusted input instead of `.get(i)`.
- Adding `#[allow(...)]` to silence clippy without a reason.
