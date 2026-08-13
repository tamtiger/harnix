---
name: harnix-brainstorm
description: Use when a Harnix project needs request triage, requirements, design, planning, or a trustworthy ready gate before implementation.
---

# Plan a Harnix task

Turn a request into decision-complete, testable task state. Inspect evidence before asking questions. Treat `ready` as a gate, not a label.

## Harnix activation guard

Locate the nearest ancestor or workspace root containing `.harnix/config.yaml`.
Activate Harnix only when that root exists and its Harnix state is valid. If no such root exists or its state is invalid, do not apply the Harnix workflow, read project state, create files, or run `harnix init`; report the condition instead.
For an initialized project, read `.harnix/workflow.md`, `.harnix/tasks/.active`, and only the minimum relevant project context.

## Incoming state

Accept either no active task or one active task still owned by `planning|replan`. If `.active` names an unfinished task, restore it instead of creating a duplicate. Hand any active task outside `planning|replan` to `harnix-continue`, including ready, in-progress, verifying, blocked, or completed-active state.

Classify the request:

- **Bypass:** explanation, review, status, or a trivial action needing no persisted task state.
- **Lite:** localized low-risk change with an obvious contract and focused validation.
- **Full:** cross-layer, migration-heavy, security-sensitive, externally researched, or materially uncertain work.

The user's initial request may authorize implementation. Do not require a second ceremonial approval after a genuine ready gate. Ask again only for an unresolved user-owned decision, new authority, destructive/external action, or material scope expansion.

## Explore evidence before questions

Inspect relevant instructions, code, tests, configs, docs, current diff, and related task history. Never ask the user for a fact the repository can answer.

Maintain a decision inventory with four groups:

1. confirmed repository facts;
2. user-owned product, compatibility, risk, or scope decisions;
3. technical unknowns needing focused research;
4. explicit non-goals and deferred work.

Ask at most one blocking question at a time. Include why it matters, your recommendation, and the trade-off. Do not manufacture a question when evidence and the request already decide the matter.

For a broad request, split independently testable deliverables before refining implementation details. Keep one active task; record ordering and ownership rather than inventing hidden dependency state.

## Build decision-complete artifacts

Persist `planning` before any product edit. Record:

- one-sentence outcome and user value;
- in-scope and out-of-scope behavior;
- observable acceptance criteria;
- exact affected contracts, files, interfaces, migrations, and compatibility behavior;
- risks, preservation rules, and rollback points;
- focused and broader validation commands;
- one explicit material-unknown decision, with task-owned research when needed.

Full tasks require `prd.md` and `plan.md`. Add `design.md` only when it materially clarifies boundaries or data flow. Plans must identify concrete files and interfaces, order RED–GREEN slices, and state what each verification proves.

## Ready self-review

Before changing the checkpoint to `ready`, run every item:

- **Decision inventory:** no unresolved material decision is disguised as an implementation step.
- **Observable acceptance criteria:** every criterion describes behavior or evidence that can be checked.
- **Spec coverage:** every requirement maps to an implementation slice and validation.
- **Contract completeness:** field names, enums, inputs, outputs, errors, precedence, migration, and ownership semantics are exact where they affect implementation.
- **Placeholder scan:** no `TBD`, `TODO`, “handle appropriately”, “similar to above”, unnamed type, or deferred choice can change the implementation.
- **Consistency scan:** PRD, plan, research, task record, and repository instructions do not contradict one another.
- **Scope check:** the task is small enough to implement and verify without mixing independent products.
- **Dirty-worktree check:** unrelated or user-owned changes are identified and preservation is explicit.

Do not mark the task `ready` while any item fails. Keep `status` at its current legal planning state, use checkpoint `replan` when revising a previously prepared task, and report the exact gap. A plan may intentionally begin with a contract-freeze slice only when that slice resolves implementation detail rather than an undecided product contract; otherwise the plan is not ready.

## Persist

Write the canonical TaskRecord fields only. Update artifacts as decisions change, then persist `ready/ready` only after the self-review passes. Do not fabricate evidence or acceptance status. Plan-only requests stop at `ready`.

## Exit

- Bypass: answer without task mutations.
- Unresolved user decision or authority: persist the valid resumable state and report one blocker.
- Plan-only: return the ready summary and paths.
- Authorized implementation with a passed gate: hand off to `harnix-implement` without another approval prompt.

## Upstream basis

Adapted for Harnix from Trellis planning/workflow at `516b34e3591001b28fda5e2d4df3f717e82f5785` and Superpowers `brainstorming`/`writing-plans` at `44c9b2d6e889982ac18c27d05a19fefe335194e1`. Harnix rejects their universal second-approval, commit, worktree, and mandatory-subagent behavior. Frozen URLs and licenses are recorded in `docs/UPSTREAM_BASELINE.md`.
