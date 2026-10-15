# Brownfield navigation

Discipline for modifying existing codebases safely and predictably.

## 1. Respect local conventions

When editing an existing file or module, conform to the existing syntax, naming conventions, formatting, and structural idioms in that file, even if they differ from your personal preference or global style guides. Do not convert working code styles gratuitously.

## 2. Minimal surgical change

Confine modifications strictly to the lines and functions required to fulfill the frozen task obligation. Avoid opportunistic refactoring, sweeping renames, or unrelated cleanups that clutter git diffs and increase regression risk.

## 3. Understand existing invariants

Before altering a routine, identify all callers, expected side effects, and implicit invariants. Read surrounding tests to understand why edge cases were written. If an existing behavior looks odd, apply Chesterton's Fence: understand why it was built before changing it.

## 4. Protect existing test coverage

Never disable, weaken, or comment out an existing test to make new code pass. If an existing test fails, either fix the regression in your implementation or, if the contract intentionally changed, document the contract revision explicitly.
