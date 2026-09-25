# C++ engineering guide

## Modern C++ idioms and memory management

- Adhere to modern C++ standards (C++17, C++20, and C++23). Avoid legacy C-style idioms, raw pointers for resource ownership, and manual `new` / `delete` invocations in all application and library code.
- Enforce the RAII (Resource Acquisition Is Initialization) idiom universally. Encapsulate all system resources—including dynamic heap memory, file descriptors, network sockets, and mutex locks—within scope-bound management classes.
- Use smart pointers with clear semantic intent: prefer `std::unique_ptr` for exclusive ownership, reserve `std::shared_ptr` for shared ownership, and use `std::weak_ptr` to break cyclical references. Pass non-owning references via raw pointers or references (`const T&`).
- Employ move semantics and `std::move` to eliminate expensive deep copies when transferring ownership of dynamic resources. Ensure custom types implement the Rule of Zero, or correctly implement the Rule of Five.

## Type safety, const correctness and zero-cost abstractions

- Maintain strict const correctness across all interfaces: mark member functions that do not alter observable object state as `const`, and accept parameters by `const&` unless ownership or mutation is required.
- Favor compile-time computation and type safety using `constexpr`, `consteval`, concepts, and templates. Validate template arguments with C++20 concepts rather than complex SFINAE boilerplate.
- Prevent implicit conversions and accidental narrowing: declare single-argument constructors as `explicit`, and use strongly typed `enum class` instead of unscoped C-style enums.
- Use `std::string_view` and `std::span` for non-owning, zero-copy views over contiguous sequences, paying close attention to object lifetime contracts to avoid dangling references.

## Error handling, safety and concurrency

- Define a clear, consistent error-handling strategy. Use exceptions for exceptional, out-of-band operational failures and use `std::optional` or `std::expected` (C++23) for expected, localized failure branches.
- Write thread-safe concurrent code using standard synchronization primitives (`std::mutex`, `std::shared_mutex`, `std::scoped_lock`, `std::atomic`). Never access shared mutable state without proper synchronization.
- Avoid undefined behavior (UB) by strictly adhering to object lifetime rules, initializing all scalar variables at declaration, checking bounds on container accesses, and avoiding type punning through raw pointer casts.

## Build systems, testing and tooling

- Standardize build pipelines around modern CMake (version >= 3.20) using target-based commands (`target_include_directories`, `target_link_libraries`, `target_compile_features`). Avoid legacy global directory commands.
- Structure automated unit tests around Catch2, GoogleTest, or Doctest, isolating private implementations from public interface contracts.
- Integrate automated sanitizers (AddressSanitizer, UndefinedBehaviorSanitizer, ThreadSanitizer) into debug test runs to catch memory corruption, data races, and undefined behavior early.
- Enforce consistent code style using `clang-format` and run static code analysis with `clang-tidy` to catch common bugs and idiom violations.
