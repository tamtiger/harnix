# Concurrency Isolation & Test Stabilization Guide

## 1. Root Causes of Flaky Tests
A flaky test is a symptom of non-determinism in the execution environment or test architecture. The primary culprits are:
1. **Asynchronous Race Conditions**: Assertions evaluated before background workers or event consumers settle.
2. **Real-Time Leakage**: Relying on ambient wall-clock time (`DateTime.UtcNow`, `new Date()`), causing failures across midnight boundaries, clock skew, or CPU scheduling latency.
3. **Shared Mutable State**: Cross-test contamination via static singletons, shared databases, or collision in filesystem temporary paths.
4. **Execution Order Dependency**: Test A mutating persistent state required by Test B, failing when executed in isolation or reverse order.
5. **Resource Exhaustion & Leaks**: Leaked database connections, unclosed file descriptors, or port binding collisions in concurrent suites.

## 2. Stabilization Techniques

### 2.1. Eliminate Fixed Sleep with Predicate Polling
Never rely on arbitrary delays like `sleep(1000)` or `Thread.Sleep(1000)`. Instead, employ condition-based polling with bounded timeout:
```typescript
// Canonical bounded predicate polling
async function waitForCondition(
  predicate: () => Promise<boolean> | boolean,
  timeoutMs = 5000,
  intervalMs = 50
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}
```

### 2.2. Deterministic Clock Injection
Inject a clock interface (`IClock` or `ClockProvider`) into components instead of reading system wall-clock directly:
```csharp
public interface IClock {
    DateTimeOffset UtcNow { get; }
}
// Tests freeze or step time forward deterministically to verify expirations, retries, and timestamps.
```

### 2.3. Resource Sandboxing & Isolation
- Scope temporary directories per test execution using unique identifiers (UUID, process ID, worker thread index).
- Enforce strict cleanup via `using`, `afterEach`, or `finally` blocks, ensuring resource disposal even on assertion failures.
- Databases: Run tests inside isolated transactions with automatic rollback, or provision isolated schema/container instances per test worker.

## 3. Flakiness Reproduction Strategy
- **Stress-Loop Execution**: Execute the target test 50–100 iterations continuously under synthetic CPU load to expose concurrency races.
- **Chaos & Jitter Injection**: Introduce small random delays into mock service responses to verify the robustness of waiting mechanisms.
