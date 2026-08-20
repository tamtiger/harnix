---
name: harnix-finish-work
description: Use when a Harnix task needs safe completion or explicit cancellation persistence, journaling, active-pointer cleanup, and an evidence-based handoff.
metadata:
  version: "1.0.9"
---

# Finish or cancel Harnix work

Close persisted workflow state truthfully without changing Git integration state. Successful completion requires current verification; explicit cancellation preserves incomplete or failed evidence without claiming success.

## Harnix activation guard

Locate the nearest ancestor or workspace root containing `.harnix/config.yaml`.
Activate Harnix only when that root exists and its Harnix state is valid. If no such root exists or its state is invalid, do not apply the Harnix workflow, read project state, create files, or run `harnix init`; report the condition instead.
Read `.harnix/workflow.md`, the active task, and its recorded evidence.

## Incoming state

Accept only one of these inputs:

- Accept only `verifying/finishing` for completion, with every required criterion `met` or explicitly `waived`, every required validation backed by fresh evidence, and no unresolved blocker;
- any unfinished state plus an explicit user instruction to cancel the task and a concise non-secret reason;
- Accept `cancelled/cancelling` only for partial cancellation recovery.

If completion prerequisites are missing, stop and return to `harnix-check`; never reinterpret “complete” as cancellation without clarifying when the user's intent is ambiguous.

## Final state review

Reread:

- the user's latest scope;
- task goal, non-goals, criteria, and validation plan;
- recorded evidence and actual exit codes;
- current diff/status and user-owned changes;
- omitted checks, waivers, and residual risks.

Confirm that evidence still describes the current files. For TaskRecord schema v2, treat the task-owned `verification-inputs.json` snapshot as immutable workflow state and use `harnix workflow --finish` so Harnix recomputes every latest required pass. If it reports changed/missing relative paths or a task-contract mismatch, verification is stale and must run again; timestamps alone are insufficient.

## Persist completion safely

Use this order:

1. follow the project-specific release instruction when one exists; do not invent package-version or changelog side effects;
2. confirm `harnix workflow --inspect` still returns this exact task at `verifying/finishing`;
3. run `harnix workflow --finish` exactly once and read its complete JSON result; do not prewrite `completed`, the journal, or `.active` directly;
4. confirm the returned task is `completed/finishing` and a new inspection has no active task;
5. report any partial persistence failure without retrying a different mutation path.

Never clear the active pointer first. Never mark completed merely because time or budget is ending. Preserve recoverable task state if a later step fails.

## Persist cancellation safely

Cancellation does not run completion gates, change criteria, delete evidence, or bump a release version merely to close the task. Use this order:

1. confirm explicit user authority and a concise reason without credentials, prompts, command output, or machine paths;
2. confirm `harnix workflow --inspect` still returns the intended unfinished task, or `cancelled/cancelling` for recovery;
3. for the first cancellation, send `{ "reason": <text>, "authorizedBy": "user" }` as bounded JSON on stdin and run `harnix workflow --cancel`; for recovery, run `harnix workflow --cancel` without replacing persisted cancellation metadata;
4. confirm the result is `cancelled/cancelling`, its evidence is unchanged, and a new inspection has no active task;
5. report the outcome as cancelled/incomplete, never completed.

The command persists terminal task state before the cancellation journal and clears only the matching active pointer last. On partial failure, preserve `cancelled/cancelling` for idempotent recovery instead of editing `.active` or the journal directly.

## Persist

Before successful finish, record actual evidence, waivers, omitted checks, residual risks, and any remaining manual action through `harnix workflow --save` with one bounded JSON envelope on stdin. Completion time and journal/archive state belong to `harnix workflow --finish`; cancellation metadata and its journal/archive state belong to `harnix workflow --cancel`. Do not fabricate a clean worktree or claim unrelated changes as part of the task.

## Exit

Report the delivered outcome first, followed by fresh verification evidence, omitted checks, and residual risks. For cancellation, say explicitly that the task ended incomplete and why. If terminal persistence was partial, report the exact durable state and recovery step.

Never commit, branch, merge, push, publish, create a pull request, delete a worktree, or discard user changes. Those are separate user-authorized actions outside Harnix finishing.

When a user requests a commit, first show the proposed changes and commit message, then wait for explicit approval before staging or committing.

## Upstream basis

Adapted for Harnix from Trellis `finish-work`/workflow persistence at `516b34e3591001b28fda5e2d4df3f717e82f5785` and the verification portion of Superpowers `finishing-a-development-branch` at `44c9b2d6e889982ac18c27d05a19fefe335194e1`. All branch, commit, merge, push, PR, discard, and worktree menu behavior is intentionally rejected.
