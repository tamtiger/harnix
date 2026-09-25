# JavaScript engineering guide

## Modern standards, module architecture, and runtime environments

- Standardize on modern ECMAScript standards (ES2022+). Target native ESM (`"type": "module"` in `package.json`) across backend and frontend environments; avoid legacy CommonJS patterns (`require`, `module.exports`) unless maintaining legacy build systems.
- Use explicit file extensions in module imports (`./utils.js`). Do not rely on directory index resolution or implicit extension lookups in native Node.js ESM execution.
- Leverage modern JavaScript syntax features: optional chaining (`?.`), nullish coalescing (`??`), logical assignment operators (`??=`, `&&=`), array grouping (`Object.groupBy`), and structured cloning (`structuredClone()`).
- Encapsulate private state inside classes using native private fields and methods (`#privateField`). Avoid using underscore naming conventions (`_privateVar`) as a fake substitute for true language-level encapsulation.
- Keep module definitions side-effect-free: importing a JavaScript module must only declare functions, classes, and constants; it must never execute asynchronous I/O, connect to databases, or mutate global environment state upon load.

## Asynchronous programming, event loop, and error handling

- Master the Node.js / browser event loop: understand the execution ordering between microtasks (`process.nextTick`, `Promise.then/catch/finally`, `queueMicrotask`) and macrotasks (`setTimeout`, `setImmediate`, I/O callbacks).
- Never leave Promises unhandled: always attach `.catch()` handlers or wrap `await` calls in appropriate `try...catch` blocks. Configure global process listeners (`unhandledRejection`, `uncaughtException`) to log structured error details and perform orderly process teardown.
- Avoid mixing callback-based legacy APIs with modern async/await code. Convert Node.js callback functions into promises using `node:util.promisify` or native promise-based module counterparts (`node:fs/promises`).
- Enforce request cancellation and deadlines using `AbortController` and `AbortSignal`. Pass `signal` instances into `fetch()`, timers, and stream operations so hung network connections or canceled user interactions abort cleanly.
- Differentiate between operational failures (network disconnect, user validation failure) and programming bugs (syntax error, type error, null dereference). Never catch broad errors and swallow them silently without logging or recovery.

## Security, sanitization, and defensive programming

- Guard against Prototype Pollution vulnerabilities: freeze base objects where appropriate, avoid recursive in-place merging of untrusted input objects, and use `Object.create(null)` or native `Map` for arbitrary key-value dictionaries.
- Validate all incoming data at system boundaries before invoking domain algorithms. Use schema validation libraries (such as Zod, Joi, or Ajv) to verify shape, types, and constraints on HTTP payloads and external messages.
- Prevent Cross-Site Scripting (XSS) and code injection: never pass untrusted strings to `eval()`, `new Function()`, `setTimeout(string)`, or `innerHTML`. Use text-only DOM APIs (`textContent`) or rigorous HTML sanitization libraries (DOMPurify).
- Prevent Command Injection and SQL Injection: execute child processes using executable-plus-argument arrays (`execFile`, `spawn`) rather than shell interpolation (`exec`). Always use parameterized query builders or ORMs for database operations.
- Cleanse sensitive data before logging: redact API keys, authentication tokens, credit card numbers, and passwords from log payloads. Ensure stack traces are suppressed in user-facing production error responses.

## Testing, performance, and tooling

- Write thorough automated tests using modern test frameworks such as Vitest or Node.js native test runner (`node:test`). Structure test suites with clear arrange-act-assert phases and descriptive test names.
- Avoid coupling tests to internal object properties or non-deterministic external networks. Use mock modules or dependency injection to provide predictable fake implementations for external dependencies.
- Optimize memory usage: clean up event listeners (`removeEventListener`), timers (`clearTimeout`, `clearInterval`), and stream subscriptions to prevent memory leaks in long-running Node.js processes.
- Profile event loop latency and performance bottlenecks using Node.js profiling tools (`--prof`, clinic.js, or Chrome DevTools inspection). Avoid blocking the single-threaded event loop with computationally expensive synchronous tasks; delegate heavy computations to Worker Threads.
- Maintain code quality using ESLint with strict rulesets (e.g., `eslint:recommended`, unicorn plugins) and Prettier for automated formatting. Enforce linting checks in CI pipelines to catch bugs before merging.
