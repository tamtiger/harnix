# Rust engineering guide

## Memory safety, ownership and lifetimes

- Embrace Rust's ownership model as the foundational architectural contract. Design data structures around explicit ownership, borrowing, and lifetime hierarchies rather than relying on smart-pointer proliferation.
- Avoid `unsafe` blocks unless wrapping verified, foreign C ABIs or strictly audited low-level performance primitives. Every `unsafe` block must document a clear safety invariant and rationale explaining why the safe compiler contracts cannot express the invariant.
- Prefer borrowing (`&T` and `&mut T`) over cloning (`T::clone()`) in hot execution paths. When ownership transfer is required, use move semantics deliberately and document ownership transitions across API boundaries.
- Utilize `Rc<RefCell<T>>` or `Arc<RwLock<T>>` only when multiple shared ownership with runtime interior mutability is strictly required by the domain. Prefer message passing or channel-based concurrency architectures where feasible.

## Error handling and idioms

- Differentiate between recoverable errors and unrecoverable program panics. Use `Result<T, E>` for all operations with anticipated failure modes and reserve `panic!` strictly for irrecoverable programmer bugs, broken invariants, or contract violations.
- Avoid `unwrap()` and bare `expect()` in production code. Provide informative, contextual messages when using `expect("explanatory context")` or use the `?` operator with custom domain error types powered by `thiserror` for libraries or `anyhow` for application binaries.
- Keep domain errors strongly typed and structured using enums. Implement `std::error::Error` and `std::fmt::Display` for all library-facing errors to ensure transparent error propagation up the call stack.
- Leverage the Newtype pattern to enforce compile-time domain validation (e.g., distinguishing `UserId(u64)` from `OrderId(u64)`), preventing primitive obsession and semantic argument swapping.

## Concurrency and async architecture

- Align asynchronous execution with the Tokio or standard async runtime conventions. Avoid blocking calls (such as synchronous filesystem I/O or sleep operations) within async worker tasks without dispatching to `tokio::task::spawn_blocking`.
- Design data types to naturally satisfy `Send` and `Sync` bounds for thread-safe cross-task communication. Keep critical lock contention durations minimal; avoid holding locks across `.await` suspension points to prevent deadlocks.
- Favor actor-like architectures using `tokio::sync::mpsc` or `tokio::sync::broadcast` channels for decoupled message passing instead of complex shared mutable state across threads.

## Tooling, cargo and testing

- Adhere strictly to the workspace `Cargo.toml` conventions. Keep dependency feature flags minimal and targeted to prevent compilation bloat and unnecessary transitive dependencies.
- Write unit tests within the same module files using `#[cfg(test)] mod tests`, and isolate public integration tests under the top-level `tests/` directory to verify public crate interfaces.
- Leverage `cargo clippy -- -D warnings` and `cargo fmt --check` as non-negotiable gates in local workflows and CI pipelines. Eliminate all compiler warnings before merging code.
