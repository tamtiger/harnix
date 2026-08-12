---
name: harnix-check
description: Use when Harnix implementation needs fresh compliance, correctness, security, maintainability, or review-feedback verification before completion.
---

# Verify a Harnix task

Evidence precedes claims. Verify compliance first, then quality and security. Read every required result and preserve failures exactly.

## Harnix activation guard

Locate the nearest ancestor or workspace root containing `.harnix/config.yaml`.
Activate Harnix only when that root exists and its Harnix state is valid. If no such root exists or its state is invalid, do not apply the Harnix workflow, read project state, create files, or run `harnix init`; report the condition instead.
Read `.harnix/workflow.md`, the active task, and the smallest verification context.

## Incoming state

Accept `in_progress` only after implementation scope and focused checks are complete, or resume `verifying/verifying`. Before running checks, persist `verifying` if not already recorded. Inspect current status/diff so verification covers actual changes, including user edits that must not be attributed to Harnix.

## Evidence rule

Map every claim to the command, inspection, or artifact that proves it. Run that evidence now. Read the complete relevant output and exit code. Do not rely on an earlier run, partial output, another agent's summary, or “it should pass.”

For non-command checks, record what was inspected, the exact scope, time, result, and concise conclusion. Never expose secrets or machine-specific paths in persisted/public evidence.

## Stage 1: compliance

Read the user's latest request, task goal/non-goals, PRD/design/plan, applicable repository instructions, and acceptance criteria. Inspect the diff and mapped tests.

For each criterion:

1. identify the changed files and observable behavior;
2. identify fresh evidence that can prove or falsify it;
3. run or inspect that evidence;
4. record an evidence ID and actual outcome;
5. mark `met` only when evidence exists, or `waived` only with an explicit reason and authority.

Check scope preservation, migration/compatibility contracts, user-owned content, public output, docs, and attribution. If implementation follows the plan but the plan violates the request/spec, compliance fails.

Do not continue to completion with a compliance defect. Route code defects to `harnix-debug`; route requirement or architecture defects to `replan`.

## Stage 2: quality and security

After compliance passes, run the focused validation plan, then the required broader gates in order. Review:

- correctness and regression coverage;
- meaningful test behavior, including observed RED when required;
- type/lint/build output and warnings;
- dependency direction and unnecessary complexity;
- input, path, command, network, credential, and secret boundaries;
- atomicity, rollback, ownership, permissions, and deterministic ordering;
- cross-layer data/error flow when multiple layers changed;
- packaging, footprint, attribution, and release scanning when applicable.

Fresh focused output cannot substitute for a required full gate. A full gate cannot prove a criterion it does not exercise.

## Review feedback discipline

Treat reviewer feedback as a technical hypothesis, not an instruction to accept blindly. Verify each item against current code and contract. Classify severity and blocking impact. Fix one confirmed issue at a time through `harnix-debug` or `harnix-implement`, then rerun the evidence that originally failed. Explain evidence-based disagreement concisely.

## Persist

For every check, record timestamp, command or inspection, scope, exit/result, and outcome. Keep failed evidence; do not overwrite history with a passing rerun. Link acceptance criteria to fresh evidence IDs. Remain `verifying` while any required item is failed, missing, stale, or unread.

## Exit

- Compliance or quality defect: persist failed evidence and the next action; route to `harnix-debug` or `replan`.
- External/repository blocker: remain resumable and report the precise condition without claiming completion.
- All required criteria and gates green: hand to `harnix-finish-work`.

Do not fix unrelated findings, weaken gates, or declare success from absence of visible errors.

## Upstream basis

Adapted for Harnix from Trellis `check` at `516b34e3591001b28fda5e2d4df3f717e82f5785` and Superpowers `verification-before-completion`, `requesting-code-review`, and `receiving-code-review` at `44c9b2d6e889982ac18c27d05a19fefe335194e1`. Mandatory reviewer subagents and Git integration are removed.
