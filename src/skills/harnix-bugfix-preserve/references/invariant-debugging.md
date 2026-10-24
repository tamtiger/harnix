# Invariant Debugging & Preservation Manual

## 1. Nature of Invariants in Software Systems
An invariant is a condition, business constraint, or data integrity guarantee that must always hold true across the lifecycle of an entity, aggregate, or transaction.
When a defect appears, it falls into one of two patterns:
1. **Invariant Breach**: An established invariant was violated due to unexpected inputs, edge-case sequencing, or race conditions.
2. **Regression Breach**: Fixing a localized defect inadvertently invalidates invariants governing existing, valid operational flows.

## 2. Four-Step Invariant Debugging Workflow
```text
1. Identify Invariants -> 2. Characterization Tests -> 3. Minimal Reproduction -> 4. Preserving Fix
```

### Step 1: Identify and Categorize Invariants
- **State Invariants**: Direct value constraints or multi-field assertions (e.g., `Balance >= 0`, `Status == Completed` implies `CompletedAt != null`).
- **Transition Invariants**: State-machine validation guards (e.g., transition from `Cancelled` to `Approved` is permanently illegal).
- **Referential Invariants**: Structural consistency between aggregates (e.g., Order `TotalAmount` must match the sum of its `OrderLines`).

### Step 2: Characterization Testing
Before editing any implementation code:
- Author tests pinning down existing, correct behaviors surrounding the defect.
- Ensure that resolving the bug does not silently break public contracts, return formats, or edge boundaries.

### Step 3: Minimal Failing Reproduction
- Eliminate large environments, remote brokers, and external database dependencies from reproduction.
- Isolate the bug into a deterministic, focused unit or integration test.
- Guarantee 100% reproducibility: the test must consistently fail before code changes.

### Step 4: Fix with Defensive Guardrails
- Encode the invariant explicitly into the domain core via guard clauses or domain exceptions.
- Re-run the reproduction test (must pass green) and existing characterization tests (must remain green).

## 3. Standard Invariant Test Patterns
- **Property-Based Testing**: Validates system guarantees across hundreds of randomized inputs satisfying preconditions.
- **Round-Trip Invariants**: `deserialize(serialize(x)) == x` or `decrypt(encrypt(x)) == x` preserves exact structural equivalence.
- **Idempotence Invariants**: `f(f(x)) == f(x)` — invoking an operation multiple times produces identical end-state after the initial execution.
