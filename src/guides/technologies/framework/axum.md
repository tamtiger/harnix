# Axum guide

## Verify

```text
cargo clippy --all-targets -- -D warnings
cargo test
cargo fmt --check
```

## Constraints

- Put body-consuming extractors (`Json<T>`, `Bytes`) last in the handler arguments.
- Keep shared state in a cheap-to-clone `AppState` (pools, `Arc<Config>`) passed with `.with_state`.
- Expose `pub fn app(state: AppState) -> Router` apart from `main` and test it with `tower::ServiceExt::oneshot`.
- Define one `AppError` enum implementing `IntoResponse`; map to explicit `StatusCode` values and JSON bodies.
- Log the error chain with `tracing::error!`; never return SQL or internal messages to clients.
- Use `.route_layer()` for per-route middleware such as auth and `.layer()` only for global concerns.
- Set `DefaultBodyLimit::max(..)`, `TimeoutLayer` and `TraceLayer::new_for_http()`.
- Serve with `axum::serve(listener, app).with_graceful_shutdown(..)`.
- Run CPU-bound work in `tokio::task::spawn_blocking`.
- Validate input in a custom extractor that calls `.validate()`.

## Common mistakes

- Holding a `std::sync::Mutex` guard across `.await`.
- Adding a layer after `.route()` calls it should wrap; layers apply only to earlier routes.
- Using `unwrap()` in handlers instead of returning `AppError`.
- Omitting `#[derive(Clone)]` on state or using non-`Send` types in it.
