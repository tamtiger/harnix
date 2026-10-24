# Verification Blindspots Detection Manual

## 1. The Illusion of Test Coverage
A test suite with 100% pass rates and high line coverage does not guarantee defect-free software. Verification suites frequently suffer from critical blindspots:
1. **Tautological Tests**: Assertions verify the exact values returned by mocks without exercising genuine domain logic or side effects.
2. **Missing Assertions (Smoke-Only Checks)**: Tests execute a path simply to verify it does not throw (`doesNotThrow`), omitting assertions on output state, return structures, or persistence effects.
3. **Happy Path Bias**: Test cases exclusively exercise ideal inputs, ignoring error branches, boundary thresholds, malformed payloads, and resource starvation.

## 2. Techniques for Blindspot Elimination

### 2.1. Systematic Boundary & Edge-Case Probing
Every input parameter must be tested across its extreme boundaries:
- **Strings**: Empty string `""`, whitespace-only `"   "`, abnormally large strings (> 10,000 characters), multibyte Unicode, emoji, mixed line endings (`\r\n` vs. `\n`), and NUL bytes (`\0`).
- **Numbers**: Zero `0`, negative boundaries `-1`, `1`, `int.MaxValue`, `int.MinValue`, floating-point edge values (`NaN`, `Infinity`).
- **Collections**: Empty collection `[]`, single-element collection, massive arrays, collections with duplicate elements or interspersed `null`/`undefined` values.
- **Objects**: `null`, `undefined`, empty object `{}`, objects missing optional fields, and objects carrying unmapped additional properties.

### 2.2. Mutation Testing Heuristics
To evaluate test suite quality, deliberately apply logic mutations to production code:
- Invert conditional operators: `if (a > b)` mutated to `if (a >= b)` or `if (a < b)`.
- Alter logical operators: replace `&&` with `||`.
- Shift literal constants: mutate `0` to `1`, or change `"active"` to `"inactive"`.
- Omit side-effect statements: comment out a status update or persistence invocation.
- **Golden Rule**: If a deliberate logic mutation results in all tests remaining green, a critical test blindspot exists. Author focused assertions to immediately fail the build on mutation.

### 2.3. Asynchronous & Concurrency Gaps
- Verify that every Promise or Task returning routine is explicitly awaited.
- Identify unhandled rejected promises and background tasks that escape the test lifecycle.
- Guarantee that all stream handles, network sockets, and file descriptors are reclaimed deterministically via `try...finally` or `using` blocks.
