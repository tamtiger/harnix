---
name: harnix-check
description: Use when Harnix needs a standalone read-only code review, review feedback evaluation, or fresh active-task compliance, correctness, security, and maintainability verification before completion.
metadata:
  version: "1.0.0"
---

# Review and verify Harnix work

Evidence precedes claims. Verify compliance first, then quality and security. Read every required result and preserve failures exactly.

## Harnix activation guard

Locate the nearest ancestor or workspace root containing `.harnix/config.yaml`.
Activate Harnix only when that root exists and its Harnix state is valid. If no such root exists or its state is invalid, do not apply the Harnix workflow, read project state, create files, or run `harnix init`; report the condition instead.
Read `.harnix/workflow.md`, the active task, and the smallest verification context.

## Incoming state

Use one of two profiles:

- **Standalone read-only review:** no active task and no mutation. Inspect the requested diff/code, report only evidence-backed findings with severity and precise location, and do not create task state, persist evidence, or fix files.
- **Active-task verification:** accept `in_progress` only after implementation scope and focused checks are complete, or resume `verifying/verifying`. Before running checks, persist `verifying` if not already recorded. Inspect current status/diff so verification covers actual changes, including user edits that must not be attributed to Harnix.

If a review request also asks for a code change, the finding is a hypothesis: route to planning/implementation before mutation rather than silently applying it from the read-only profile.

## Standalone code-review protocol

Bound the review before inspecting code. Honor an explicit commit range or file/path scope. Otherwise use the current working-tree diff when available, plus only the surrounding requirements, implementation, and tests needed to assess it. If no diff exists, agree or infer the smallest bounded paths from the request and state that scope. Use read-only inspection such as `git diff`, `git show`, and file reads; never move HEAD, change the index, create a worktree, or mutate an external review system.

Review requirements and behavioral compliance before correctness, security, maintainability, tests, compatibility, and operational risk. Read the relevant code rather than inferring behavior from filenames, summaries, or test names. Run focused checks only when they materially support or falsify a finding, and report any omitted checks.

Report findings first, ordered by actual severity. Every finding must include:

- severity and a precise `file:line` location;
- the concrete defect or risk and when it occurs;
- why the impact matters for this repository;
- the code, diff, test, or command evidence supporting it;
- a concise fix direction when it is not obvious.

End with a verdict of `ready`, `ready-with-fixes`, or `not-ready`, plus the reviewed scope and residual risk. If no findings remain, say so explicitly but still name the scope, omitted checks, and residual risk; absence of a visible defect is not proof of correctness. Do not require praise, a reviewer subagent, Git history, or a merge operation.

## Evidence rule

Map every claim to the command, inspection, or artifact that proves it. Run that evidence now. Read the complete relevant output and exit code. Do not rely on an earlier run, partial output, another agent's summary, or “it should pass.”

For non-command checks, record what was inspected, the exact scope, time, result, and concise conclusion. Never expose secrets or machine-specific paths in persisted/public evidence.

For each TaskRecord schema v2 required check, capture `harnix internal workflow snapshot --check <id>` immediately before the non-mutating check and again after its complete output is read. Persist a passing evidence item only when the two snapshots have the same `inputDigest`, and attach that digest to the evidence. A mismatch, empty glob, missing input, unreadable input, or unsafe path is failed freshness evidence, not a warning to ignore.

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

Treat reviewer feedback as a technical hypothesis, not an instruction to accept blindly. Read the complete feedback, clarify ambiguous or coupled items before mutation, and verify each item against current requirements, code, tests, compatibility, and user decisions. Classify severity and blocking impact. Explain evidence-based disagreement concisely.

When fixes are authorized through an active task, handle one confirmed item at a time in blocking order through `harnix-debug` or `harnix-implement`, then rerun the evidence that originally failed. Review feedback alone never grants permission to edit files, reply on an external system, or change Git state.

## Persist

For every check, record timestamp, command or inspection, scope, exit/result, outcome, and required v2 `inputDigest`. Keep failed evidence; do not overwrite history with a passing rerun. Link acceptance criteria only to fresh passing evidence whose declared `criterionIds` contains that criterion. Remain `verifying` while any required item is failed, missing, stale, or unread.

## Exit

- Compliance or quality defect: persist failed evidence and the next action; route to `harnix-debug` or `replan`.
- External/repository blocker: remain resumable and report the precise condition without claiming completion.
- All required criteria and gates green: persist `verifying/finishing`, reread the saved task, then hand to `harnix-finish-work`.

Do not fix unrelated findings, weaken gates, or declare success from absence of visible errors.

## Upstream basis

Adapted for Harnix from Trellis `check` at `516b34e3591001b28fda5e2d4df3f717e82f5785` and Superpowers `verification-before-completion`, `requesting-code-review`, and `receiving-code-review` at `44c9b2d6e889982ac18c27d05a19fefe335194e1`. Mandatory reviewer subagents and Git integration are removed.
