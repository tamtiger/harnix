---
name: harnix-review
description: Use when Harnix needs a standalone read-only code review of a diff, commit range or paths, or an evaluation of review feedback, without touching any task.
metadata:
  version: "2.0.0-dev.11"
---

# Review code (read-only)

Report evidence-backed findings. This profile never creates, reads or changes task state: an unrelated active task stays untouched, and you do not need `.harnix/workflow.md`.

## Scope

Honor an explicit commit range or path list. Otherwise review the current working-tree diff plus only the requirements, implementation and tests needed to judge it. With no diff, infer the smallest paths from the request and state that scope. Use read-only inspection (`git diff`, `git show`, file reads); never move HEAD, change the index, create a worktree or touch an external review system.

## Review

Requirements and behavioral compliance first, then correctness, security, maintainability, tests, compatibility and operational risk. Read the code; do not infer behavior from names, summaries or test titles. Run a focused check only when it supports or falsifies a finding, and say which checks you omitted.

Worth flagging: a find-or-create without a unique constraint; a status transition without an atomic `WHERE old-status` guard; a token compared with `==` instead of a constant-time comparison; untrusted or LLM output stored or queried without validation; an N+1 query from loading an association in a loop; missing tests for new behavior; an unhandled error path.

Do not report: readability-only redundancy, a request to comment a threshold, consistency-only reshaping, a harmless no-op, style a linter enforces, or anything the diff already fixes. Read the complete diff before flagging a gap.

## Report

Findings first, most severe first. Each has a severity, a precise `file:line`, the defect and when it occurs, why it matters here, the code or command evidence, and a fix direction when it is not obvious. Then a verdict (`ready`, `ready-with-fixes`, `not-ready`), the reviewed scope, omitted checks and residual risk. No findings is stated explicitly, still with scope and residual risk; absence of a visible defect is not proof of correctness.

## Feedback on a review

Treat reviewer feedback as a hypothesis: read all of it, verify each item against current code and requirements, disagree with evidence when it conflicts, and never edit files, reply on an external system or change Git state because of it.

## Exit

A request that also asks for a change is a tracked change: the finding is a hypothesis, so hand it to `harnix-plan` before any edit. Otherwise stop after the report.
