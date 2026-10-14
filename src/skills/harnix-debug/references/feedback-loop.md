# Debugging feedback loop and forced mutation

Controlled feedback loop to isolate and resolve defects deterministically, eliminating guesswork and ensuring regression tests are sensitive to regressions.

## 4-Step controlled loop

Every debugging session in Harnix follows a disciplined closed loop:

```text
[1. Reproduce] -> [2. One Hypothesis] -> [3. Minimal Fix] -> [4. Regression Test]
```

1. **Step 1: Reproduce (Minimal reproducer)**:
   - Construct the smallest deterministic reproduction case.
   - Identify exact input/output boundaries and the narrowest command exposing the defect.
   - Do not edit code until reproducible failure is demonstrated.

2. **Step 2: One Hypothesis (One hypothesis at a time)**:
   - Formulate a single falsifiable hypothesis:
     *The root cause is X because of evidence Y, and minimal experiment Z will confirm or refute it.*
   - Never test multiple hypotheses simultaneously or apply shotgun speculative changes.
   - If refuted: treat the result as empirical evidence, revert trial changes completely, then form the next hypothesis.
   - After 3 consecutive failed hypotheses: stop, re-evaluate assumptions, and replan with the user.

3. **Step 3: Minimal Fix (Fix at root cause)**:
   - Target the precise root cause, not superficial symptom wrappers.
   - Keep changes minimal, cleanly revertible, and focused without diff bloat.

4. **Step 4: Regression Test (Preserve with regression tests)**:
   - Write a dedicated regression test reproducing the original defect before closing the issue.
   - Rerun the reproducer and adjacent test suites to verify total elimination of the issue.

## Forced mutation technique

To guard against false passes (green tests that do not actually exercise the defect) and weak assertions:

1. **Principle**: A test has value only if it turns RED when the implementation logic is broken.
2. **Forced mutation workflow**:
   - After writing the fix and regression test, intentionally break the relevant business logic (e.g. invert an `if` condition, change comparison operators, or return a hardcoded erroneous value).
   - Run the regression test: it **must FAIL**.
   - If the test still PASSES with broken logic: the test is insensitive or assertions are ineffective. Tighten assertions immediately.
   - Revert the intentional mutation and verify the test turns PASS again.
