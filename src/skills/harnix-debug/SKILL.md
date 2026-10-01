---
name: harnix-debug
description: Use when a Harnix implementation or verification has a reproducible bug, failing test, unexpected behavior, loop or repeated unsuccessful fix.
metadata:
  version: "2.0.0-dev.11"
---

# Debug with evidence

Find the root cause before changing behavior. Test one falsifiable hypothesis at a time and keep recovery contained.

## Start

The guard and state rules are in the always-loaded Harnix block. Run `harnix workflow --preflight`; `nextStage: debug` is yours. Accept `in_progress` or `verifying` with a reproducible failure or unexpected result and keep the owning status and earlier evidence. A blocked task: read its blocker, resolve or report it, continue at its resume status. Debugging never stands in for an unresolved requirement or product decision: route those to a replan via `harnix-plan`.

## Scope gate

Before reproducing anything compare the failure with the latest request, goal and non-goals, `relevantPaths`, the plan slice and the authority granted. If it is outside the goal, unrelated to a required check or needs new authority, keep only a bounded diagnosis and route to replan or ask the user; do not absorb it into the current fix.

## Capture

Before retrying record: expected and actual behavior, the exact command and result and the smallest reproducer, the last good and first bad boundary, environment assumptions and changed files, earlier attempts, and whether it is deterministic, intermittent, environmental or policy-related. Failed check evidence may carry structured `findings`; `harnix status --explain` gives stable reason codes. Reproduce with the narrowest command; if that is unsafe or external, inspect read-only and say so.

## Find the root cause

Trace data and control backward from the symptom; `harnix repo-map --impact <path>` shows import chains; the matching `.harnix/spec/guides/` set the conventions a fix must obey. Inspect what enters and leaves each boundary, recent changes, configuration, path normalization, dependency state and error propagation. One material unknown about behavior or a dependency: run one bounded `harnix skill harnix-research` pass (task-scoped) and record the conclusion.

State one hypothesis: **X is the root cause** because **Y evidence**, and **Z minimal check** will separate it from the alternatives. Run only that check, one variable at a time. A failed hypothesis is evidence; record it and form the next instead of stacking fixes.

## Contained recovery

Write the smallest failing regression test (or strongest reproducer), see it fail, make one fix at the root cause, rerun the reproducer and neighbors, remove temporary instrumentation and keep the regression test. Use the smallest reversible action and claim only recovery you actually performed.

One automatic remediation round per verification failure. A failed rerun after it stops automatic work; an identical check, digest, exit code and summary is the strongest signal; skipped or future-dated evidence never resets it. After three distinct failed hypotheses for one symptom stop, reassess assumptions and architecture with the user or replan.

## Persist and exit

Record each hypothesis (symptom, evidence, hypothesis, discriminating check, result, next decision) as decisions or evidence findings, keep earlier failures, link the regression and GREEN evidence, and keep paths and secrets out of reports.

- Confirmed fix during implementation: back to `in_progress/implementing`; only reruns left: `verifying/verifying`.
- Requirement or architecture defect, or three failed hypotheses: checkpoint `replan`, hand to `harnix-plan`.
- External blocker: keep resumable state and report the exact dependency or authority needed.
