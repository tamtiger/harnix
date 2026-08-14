---
name: harnix-debug
description: Use when a Harnix implementation or verification has a reproducible bug, failing test, unexpected behavior, loop, or repeated unsuccessful fix.
metadata:
  version: "1.0.0"
---

# Debug with evidence

Find the root cause before changing production behavior. Test one falsifiable hypothesis at a time and keep the recovery contained.

## Harnix activation guard

Locate the nearest ancestor or workspace root containing `.harnix/config.yaml`.
Activate Harnix only when that root exists and its Harnix state is valid. If no such root exists or its state is invalid, do not apply the Harnix workflow, read project state, create files, or run `harnix init`; report the condition instead.
Read `.harnix/workflow.md`, the active task, current failure evidence, and only the affected execution path.

## Incoming state

Accept `in_progress` or `verifying` with a reproducible failure or unexpected result. Persist checkpoint `debugging` while retaining the owning status and previous evidence. Do not use debugging as a substitute for an unresolved requirement or product decision; route those to `replan`.

## Capture the failure

Record before retrying:

- expected and actual behavior;
- exact command/tool, exit/result, and smallest reproducer;
- last successful boundary and first observed bad boundary;
- relevant environment assumptions, inputs, and changed files;
- repeated attempts already made;
- whether the failure is deterministic, intermittent, environmental, or policy-related.

Reproduce with the narrowest command. If reproduction is unsafe or external, inspect read-only evidence and state the limitation.

## Investigate root cause

Trace the data/control path backward from the symptom. At component boundaries, inspect what enters and leaves. Check recent changes, configuration, ownership, filesystem/path normalization, dependency state, and error propagation. Gather evidence before proposing a fix.

State one falsifiable hypothesis in this form:

> I think **X is the root cause** because **Y evidence**, and **Z minimal check** will distinguish it from alternatives.

Run only that discriminating check. Change one variable at a time. A failed hypothesis is evidence; record it and form a new one instead of stacking another fix.

## Contained recovery

After confirming the cause:

1. write the smallest failing regression test or strongest meaningful reproducer;
2. observe the expected failure;
3. implement one fix at the root cause;
4. rerun the reproducer and relevant neighboring checks;
5. remove temporary instrumentation and keep useful regression protection.

Use the smallest reversible action. Do not claim reset, auto-healing, service recovery, or configuration changes that were not actually performed.

If three failed hypotheses address the same symptom, stop. Do not attempt a fourth speculative fix. Reassess requirements, boundaries, and architecture with the user or return to planning/replan. Three failed hypotheses indicate that the mental model or architecture may be wrong, not that more patches are needed.

## Persist

For each hypothesis record symptom, evidence, hypothesis, discriminating check, result, and next decision. Preserve earlier failed attempts. For a confirmed cause, link the regression evidence and focused GREEN result. Keep machine paths and secrets out of persisted/public reports.

## Exit

- Confirmed fix during implementation: return to `in_progress/implementing`.
- Confirmed fix with only verification reruns left: return to `verifying/verifying`.
- Requirement or architecture defect, or three failed hypotheses: checkpoint `replan` and return to `harnix-brainstorm`.
- External blocker: retain resumable state and report the exact dependency or authority needed.

## Upstream basis

Adapted for Harnix from Superpowers `systematic-debugging` at `44c9b2d6e889982ac18c27d05a19fefe335194e1` and ECC `agent-introspection-debugging` at `f1fec0e53934737d3b3b8388b0fd1651e8b62f4f`. Harnix keeps root-cause discipline, boundary evidence, contained recovery, and the three-failure architecture reset without promising hidden agent/runtime controls.
