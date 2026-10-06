---
name: harnix-verification-gap
description: Use when evaluating whether a test suite, verification plan or review scope has hidden gaps, false-success blind spots or unverified critical requirements.
metadata:
  version: "2.2.0-dev.3"
---

# Verification gap analysis

Identify what existing tests claim to verify versus what is actually proven by code execution and assertions.

## Evidence and Rationale

Evidence source: `research/external-research.md` (§B Superpowers/BMAD verification-gap reviewer, §C 2606.09863 & 2607.25152 self-evaluation false success rates up to 75.8%, §D 10 verification-gap lens).
Automated tests and agent self-evaluations frequently exhibit false success when assertions are loose, tautological, or bypassed through mocks that mask runtime assumptions. A systematic verification-gap review exposes blind spots before implementation is declared complete.

## When to use

- In planning: when drafting the validation plan to ensure every non-waived criterion has an unambiguous, falsifiable check.
- In review/verification: when judging test coverage beyond raw line counts to ensure acceptance criteria are genuinely exercised.
- When evaluating flaky or unexpectedly passing suites where behavior should have failed.

## Focus areas

1. **Assertion strength**:
   - Check if assertions test exact outputs or merely check for non-null/truthy values.
   - Detect tautologies: tests that assert `true === true` or test mocked behavior against the mock definition rather than production logic.
   - Ensure negative conditions and error codes are explicitly asserted, not just "an error was thrown".

2. **Mock fidelity**:
   - Identify over-mocking: mocks that return pre-cooked answers for the exact logic under test.
   - Verify that boundary interfaces (filesystem, network, process runner, time) have realistic contracts and error behaviors.

3. **Requirement traceability**:
   - Map each acceptance criterion to specific test cases and verify the test fails if the criterion is broken.
   - Look for omitted combinations: concurrent access, empty states, boundary values, invalid encoding.

4. **Integration boundary**:
   - Check whether unit passes leave cross-component wiring untested.
   - Ensure suite gates cover real artifacts without relying on in-memory mock short-circuits.

## Analysis steps

1. Trace backwards from each acceptance criterion to its designated check command.
2. Read the actual test assertions in the test files matching the criterion.
3. Formulate one gap hypothesis: "If bug X occurred, would this test catch it or pass silently?"
4. If it would pass silently, document the verification gap and propose the exact assertion or test case needed.
