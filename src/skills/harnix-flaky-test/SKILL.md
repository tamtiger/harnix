---
name: harnix-flaky-test
description: Use when diagnosing, reproducing and stabilizing intermittent, non-deterministic or timing-dependent test failures.
metadata:
  version: "2.0.0-dev.14"
---

# Flaky test diagnosis and stabilization

Isolate the source of non-determinism, eliminate environmental dependencies, and achieve reproducible green suites.

## Evidence and Rationale

Evidence source: `research/external-research.md` (§B Superpowers "the project's suite defines green", noting that in 11 of 12 runs agents only inspect single test files, leaving cross-test interactions and timing leaks undetected).
Flaky tests destroy trust in verification gates and waste significant token and execution budgets in repeated runs. Eliminating non-determinism at the root is required for dependable automation.

## When to use

- When a test passes locally or in isolation but fails intermittently in the full suite.
- When test outcome depends on execution order, execution speed, or system load.
- When tests involve timers, asynchronous intervals, file locks, or shared global state.

## Common flakiness root causes

1. **Shared mutable state**:
   - Module-level variables, singleton registries, or memoized caches persisting between tests.
   - Missing cleanup in `afterEach` or `afterAll`.

2. **Timing and concurrency**:
   - Using fixed sleep/timeout delays instead of event/condition polling or deterministically injected clocks.
   - Unhandled promises or background timers firing after a test teardown has already finished.

3. **Order dependency**:
   - Tests assuming preceding tests created directories, database records, or environment variables.
   - Tests mutating global environment variables (`process.env`) without restoring them.

4. **Resource collisions**:
   - Hardcoded port numbers, temporary directory paths, or lock file paths colliding during concurrent test execution.

## Stabilization procedure

1. **Reproduce deterministically**:
   - Run the suspect test in a loop: repeat 20–50 times sequentially.
   - Run with shuffled test order to detect ordering assumptions.
2. **Inject deterministic dependencies**:
   - Replace wall-clock time with an injectable clock interface or fake timers.
   - Replace shared paths with isolated temporary directories per test run.
3. **Ensure complete teardown**:
   - Always wrap state mutations in try/finally or register teardown hooks immediately upon setup.
   - Ensure all open handles (file descriptors, sockets, processes, timers) are terminated before test completion.
4. **Prove stability**:
   - Run the isolated test repeated 20 times with exit code 0.
   - Run the broader suite with random seed order to verify no side-effects leak.
