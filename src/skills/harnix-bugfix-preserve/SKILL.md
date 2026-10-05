---
name: harnix-bugfix-preserve
description: Use when fixing a bug to explicitly define invariants that must remain working, prevent regressions and isolate the fix.
metadata:
  version: "2.0.4"
---

# Bugfix preservation

Define what must remain working before touching code, isolate regressions with targeted tests, and keep fixes minimal.

## Evidence and Rationale

Evidence source: `research/external-research.md` (§B Kiro Bugfix Spec "what must remain working", §C TDAD 2603.17973 measuring regression drop from 6.08% to 1.82% when specific tests to run are declared, §D 9 bugfix invariants).
Generic prompt-based debugging often introduces regressions in neighboring behaviors. Explicitly stating invariants and pinning affected tests dramatically reduces unintended side effects.

## When to use

- In triage and planning of bug fixes or unexpected failures.
- When fixing an issue in shared core logic where multiple callers depend on existing contracts.
- In remediation loops after a test failure.

## Focus areas

1. **What must remain working**:
   - Enumerate existing interfaces, return shapes, side effects and invariant behaviors that must not change.
   - List neighboring test files and suite commands that must continue to pass untouched.

2. **Reproduction test first (RED)**:
   - Write a minimal failing test that reproduces the exact defect with the observed symptom.
   - Confirm it fails solely because of the bug, not an invalid test setup.

3. **Surgical fix (GREEN)**:
   - Make the smallest possible change to production code that addresses root cause.
   - Avoid speculative refactoring, formatting sweeps, or gratuitous abstraction changes in a bugfix.

4. **Preservation check**:
   - Run the new reproduction test to confirm it is green.
   - Run neighboring focused tests and the full suite to prove existing contracts remain intact.

## Procedure

1. Document the invariant list: "The fix for issue X must preserve behavior Y and contract Z."
2. Implement the failing regression test and verify the failure mode.
3. Apply the minimal fix to production code.
4. Verify both the fix and the preserved invariants pass cleanly.
