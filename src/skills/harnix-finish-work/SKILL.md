---
name: harnix-finish-work
description: Use when a Harnix task is fully verified and needs safe completion persistence, journaling, active-pointer cleanup, and an evidence-based handoff.
---

# Finish verified Harnix work

Complete persisted workflow state without changing Git integration state. Verification must already be real and current.

## Harnix activation guard

Locate the nearest ancestor or workspace root containing `.harnix/config.yaml`.
Activate Harnix only when that root exists and its Harnix state is valid. If no such root exists or its state is invalid, do not apply the Harnix workflow, read project state, create files, or run `harnix init`; report the condition instead.
Read `.harnix/workflow.md`, the active task, and its recorded evidence.

## Incoming state

Accept only `verifying/verifying` with every required acceptance criterion `met` or explicitly `waived`, every required validation backed by fresh evidence, and no unresolved blocker. If any prerequisite is missing, stop and return to `harnix-check`.

## Final state review

Reread:

- the user's latest scope;
- task goal, non-goals, criteria, and validation plan;
- recorded evidence and actual exit codes;
- current diff/status and user-owned changes;
- omitted checks, waivers, and residual risks.

Confirm that evidence still describes the current files. If files changed after the last relevant check, verification is stale and must run again.

## Persist completion safely

Use this order:

1. increment the package patch version and update `CHANGELOG.md`; include both in the task's final verification evidence;
2. write the task `status` as `completed`, checkpoint `finishing`, `completedAt`, and final evidence links;
3. persist the journal/archive material required by the project workflow;
4. clear `.harnix/tasks/.active` only when it still points to this exact task;
5. reread the written state and report any partial persistence failure.

Never clear the active pointer first. Never mark completed merely because time or budget is ending. Preserve recoverable task state if a later step fails.

Do not promote project learning automatically. Record a reviewable learning candidate only when the workflow contract and evidence threshold allow it; user-owned specs remain user-owned.

## Persist

Record actual completion time, evidence, waivers, omitted checks, residual risks, and any remaining manual action. Do not fabricate a clean worktree or claim unrelated changes as part of the task.

## Exit

Report the delivered outcome first, followed by fresh verification evidence, omitted checks, and residual risks. If completion persistence was partial, report the exact durable state and recovery step.

Never commit, branch, merge, push, publish, create a pull request, delete a worktree, or discard user changes. Those are separate user-authorized actions outside Harnix finishing.

When a user requests a commit, first show the proposed changes and commit message, then wait for explicit approval before staging or committing.

## Upstream basis

Adapted for Harnix from Trellis `finish-work`/workflow persistence at `516b34e3591001b28fda5e2d4df3f717e82f5785` and the verification portion of Superpowers `finishing-a-development-branch` at `44c9b2d6e889982ac18c27d05a19fefe335194e1`. All branch, commit, merge, push, PR, discard, and worktree menu behavior is intentionally rejected.
