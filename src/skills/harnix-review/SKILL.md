---
name: harnix-review
description: Use when Harnix needs a standalone read-only code review of a diff, commit range or paths, or an evaluation of review feedback, without touching any task.
metadata:
  version: "2.17.1"
---

# Review code (read-only)

Report evidence-backed findings. This profile never creates, reads or changes task state: an unrelated active task stays untouched, and you do not need `.harnix/workflow.md`.

## Scope

Honor an explicit commit range or path list. Otherwise review the current working-tree diff plus only the requirements, implementation and tests needed to judge it. With no diff, infer the smallest paths from the request and state that scope. Use read-only inspection (`git diff`, `git show`, file reads); never move HEAD, change the index, create a worktree or touch an external review system.

## Review

Evaluate changes along two distinct axes: **Spec axis** (task behavioral requirements) and **Standards axis** (codebase health, design patterns and baseline quality). Read the code; do not infer behavior from names, summaries or test titles. Run a focused check only when it supports or falsifies a finding, and say which checks you omitted.

### 1. Spec axis (Requirements and behavior)

- Verify direct compliance with acceptance criteria, task goals, API contracts and intended behavior.
- Probe edge cases, data flow, missing tests for new behavior, and unhandled error paths.
- Requirements and behavioral compliance first, then correctness, security, maintainability, tests, compatibility and operational risk.

### 2. Standards axis (Patterns and baseline health)

- **Chesterton's Fence**: never simplify, refactor, or delete existing constraints or code without understanding and proving why they were established.
- **Smell baseline**: establish the pre-existing code smell baseline; do not flag existing repository debt outside the diff scope.
- Worth flagging: a find-or-create without a unique constraint; a status transition without an atomic `WHERE old-status` guard; a token compared with `==` instead of a constant-time comparison; untrusted or LLM output stored or queried without validation; an N+1 query from loading an association in a loop; string concatenation in SQL queries; missing resource ownership or authorization checks (IDOR); debug printing (`System.out.print`, `Console.Write`) instead of structured logging; unmasked PII in log records; missing tests for new behavior; an unhandled error path.

Do not report: readability-only redundancy, a request to comment a threshold, consistency-only reshaping, a harmless no-op, style a linter enforces, or anything the diff already fixes. Read the complete diff before flagging a gap. A wide or risky change may use independent lenses, with subagents when the platform has them: read `./references/multi-lens.md` (or `harnix skill harnix-review --reference multi-lens`).

## Report

Findings first, most severe first. Each has a severity, a precise `file:line`, the defect and when it occurs, why it matters here, the code or command evidence, and a fix direction when it is not obvious. Then a verdict (`ready`, `ready-with-fixes`, `not-ready`), the reviewed scope, omitted checks and residual risk. No findings is stated explicitly, still with scope and residual risk; absence of a visible defect is not proof of correctness.

## Feedback on a review

Treat reviewer feedback as a hypothesis: read all of it, verify each item against current code and requirements, disagree with evidence when it conflicts, and never edit files, reply on an external system or change Git state because of it.

## Technique skills

Use native agent skills on demand (load via `harnix skill <name>`):

- Verification and test blind spots: `harnix skill harnix-verification-gap`.
- Security patterns and threat vectors: `harnix skill harnix-security-lens`.
- Schema and migration safety: `harnix skill harnix-migration-safety`.

## Exit

A request that also asks for a change is a tracked change: the finding is a hypothesis, so hand it to `harnix-plan` before any edit. Otherwise stop after the report.
