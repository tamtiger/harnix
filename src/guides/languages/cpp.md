# C++ guide

## Verify

```text
cmake --build build
ctest --test-dir build --output-on-failure
clang-format --dry-run --Werror <files>
clang-tidy -p build <files>
```

## Constraints

- Do not use raw `new`/`delete`; use `std::make_unique` or `std::make_shared`.
- Wrap every resource (file, socket, lock) in an RAII type; lock with `std::scoped_lock`.
- Use `std::unique_ptr` for ownership; break `shared_ptr` cycles with `std::weak_ptr`.
- Follow the Rule of Zero, or define all five special members.
- Mark single-argument constructors `explicit` and use `enum class`.
- Mark non-mutating members `const` and pass large inputs as `const T&`.
- Never keep a `std::string_view` or `std::span` beyond its owner's lifetime.
- Initialize every scalar at declaration and use `.at()` for untrusted indexes; replace `strcpy`, `sprintf`, `malloc`/`free` and C arrays with `std::string`, `std::vector` and `std::array`.
- Guard shared mutable state with `std::mutex` or `std::atomic`.
- Use target-based CMake (`target_link_libraries`, `target_compile_features`); no global `include_directories`.

## Common mistakes

- Returning a reference to a local or temporary.
- Calling `std::move` on a `const` object, which silently copies.
- Throwing from a destructor.
- Skipping `-fsanitize=address,undefined` in debug test builds.
- Slicing a derived object by passing it to a base by value.
- Relying on signed integer overflow or a null dereference (undefined behavior).
