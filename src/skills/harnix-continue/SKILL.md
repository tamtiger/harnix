---
name: harnix-continue
description: Use when an initialized Harnix project may have an unfinished, interrupted, blocked, or partially persisted task that must resume safely.
metadata:
  version: "1.0.5"
---

# Continue persisted Harnix work

Restore truth from disk, validate it, and route to the owner of the current stage. Do not reconstruct workflow state from conversation memory.

## Harnix activation guard

Locate the nearest ancestor or workspace root containing `.harnix/config.yaml`.
Activate Harnix only when that root exists and its Harnix state is valid. If no such root exists or its state is invalid, do not apply the Harnix workflow, read project state, create files, or run `harnix init`; report the condition instead.
Read `.harnix/workflow.md` before routing.

## Incoming state

Read `.harnix/tasks/.active`. If it is absent or empty, return to request triage without creating a task. If it points outside the safe task root, to a missing record, or to malformed/future state, fail closed and provide repair-only guidance.

Load the TaskRecord, required artifacts for its mode/status, checkpoint, blocker/resume fields, acceptance criteria, evidence references, and only the context needed by the next stage. Verify referenced task-owned paths before trusting them.

Run `harnix workflow inspect` and read its active TaskRecord projection plus always-present `contextDrift`. If its state is `stale`, do not rely on the saved context. For a non-blocked unfinished task, persist the same task status with checkpoint `replan`, preserve all evidence and obligations, then route to `harnix-brainstorm` to reselect context. `not-recorded` is disclosed for legacy tasks but does not force replan. Never repair source files or the context manifest automatically.

## Routing table

| Persisted state | Route |
|---|---|
| `planning` or checkpoint `replan` | `harnix-brainstorm` |
| `ready/ready` with implementation already authorized | `harnix-implement` |
| `ready/ready` for plan-only work | report ready; wait for an implementation request |
| `in_progress/implementing` | `harnix-implement` from the last recorded slice |
| `in_progress/debugging` | `harnix-debug` from the recorded symptom/hypothesis |
| `verifying/verifying` | `harnix-check`, preserving prior failed/passing evidence |
| `verifying/finishing` with green prerequisites | `harnix-finish-work` |
| `blocked` with unchanged blocker | report blocker and resume status; do not pretend progress |
| `completed` still active | validate completion persistence, then repair pointer/archive only within the documented workflow |

Blocked state takes precedence over its checkpoint. Never route a blocked `replan`, `debugging`, or `finishing` checkpoint directly to another stage owner until Continue validates that the blocker has changed and resumes the task to its recorded status.

For `completed/finishing` still active, rerun the hidden workflow finish recovery. It reuses the deterministic completion journal ID, appends the journal only when missing, and clears only the matching active pointer; it must not demand new verification for completion already persisted durably.

Do not interpret `ready` as proof that the ready gate passed when artifacts contradict it. Route to `replan` if a material decision, placeholder, or contract gap is visible.

## Recover partial persistence

When state and artifacts disagree:

1. identify the last durable valid state;
2. compare timestamps/evidence without inventing missing events;
3. preserve user-owned and unrelated files;
4. choose the smallest safe repair allowed by the workflow;
5. request user authority if repair would overwrite, delete, or broaden scope.

Never silently downgrade schema, discard evidence, clear a blocker, or advance a status to make the record convenient.

Doctor finding `legacy-task-schema` is diagnostic only. Continue reads schema v1 exactly and does not rewrite it. An unfinished v1 to v2 migration is owned by planning at checkpoint `replan`, requires explicit authorization and exact migration evidence, and preserves prior criteria/evidence; completed v1 records remain byte-preserved.

## Persist

Ordinary continuation is read-only until the owning skill performs its documented transition. The single workflow-owned exception is stale context: send the inspected TaskRecord with checkpoint `replan` through a bounded JSON envelope on stdin to `harnix workflow save`, preserving the same unfinished status before context reselection. Never edit `task.json` directly. If a safe metadata repair is authorized and required, record exactly what was repaired and why. Keep blocker, resume status, failed evidence, and next step intact.

## Exit

Hand off to exactly one stage owner with the active task path, validated status/checkpoint, last durable evidence, and next action. For invalid state, stop with repair guidance. For no active task, return to triage.

## Upstream basis

Adapted for Harnix from Trellis `continue` and workflow routing at `516b34e3591001b28fda5e2d4df3f717e82f5785`. Harnix keeps status/artifact recovery while removing session hooks, mandatory subagents, automatic commits, and platform-specific command ceremony.
