---
name: harnix-implement
description: Use when an authorized Harnix task is ready or in progress, or a small direct change needs test-first implementation, refactoring, release preparation or technical-feedback handling.
metadata:
  version: "2.0.0-dev.13"
---

# Implement with evidence

Review before coding, prove the behavior with a failing test, make the smallest coherent change, leave resumable evidence.

## Start

The guard and state rules are in the always-loaded Harnix block. For a tracked task run `harnix workflow --preflight`; `nextStage: implement` is yours. A `ready` task needs the latest request to authorize implementation; then `harnix workflow --transition in_progress/implementing` before the first product edit. A direct Bypass change has no task: skip the task steps, keep the TDD and verify rules, and report the commands you ran.

A blocked task: read its blocker, resolve it or report the exact condition, then continue at its resume status. Route every reproducible failure to `harnix-debug`.

## Review the plan

Read the task artifacts, the matching `.harnix/spec/guides/`, the affected code and tests, and the current diff. Confirm no material decision is open, every named file or interface exists or is created, each slice has a RED and a focused GREEN command, and the checklist is ordered and unchecked. A critical gap is not coded around: set checkpoint `replan` (a flag edit with `--reason`) and hand back to `harnix-plan`. `harnix repo-map --query` / `--impact` are navigation hints; verify the source yourself.

## RED, GREEN, REFACTOR per behavior

1. **RED:** one focused test of real behavior. Run it and see it fail for the intended reason (not a setup crash, not a rename of a passing test). A test that passes at once proves nothing.
2. **GREEN:** the minimal implementation of the frozen contract. Run the focused and neighboring tests. Fix production code when the contract is right; never bend the test.
3. **Evidence:** for a schema v3 required check run `harnix workflow --run-check <id> -- <exe> [args...]` (snapshots the inputs before and after, records the outcome). Detail: `../harnix-verify/references/evidence.md` (or `harnix skill harnix-verify --reference evidence`).
4. **REFACTOR** only while green, then rerun the focused checks.

Prose-only wording, generated snapshots and trivial wiring may skip RED: record why and use the strongest alternative (schema validation, parity, typecheck, build, focused integration test).

## Track progress

After each slice and its focused evidence tick its `- [ ]` to `- [x]` in `plan.md` (Full tasks; a Lite task has none and its progress is the persisted checks). The Full checklist must be 100% before `harnix workflow --transition verifying/verifying`. Record reusable lessons as you learn them: `harnix workflow --add-risk <id> --text <t>` / `--add-decision`.

## Release preparation

Release-visible changes bump the package version at most once (`pnpm version:sync`) and amend the same changelog entry; regenerate managed output when its canonical input changes. Do this before verifying: finish never edits the product.

## Feedback and stop conditions

Reviewer or user feedback is a hypothesis: read all of it, verify it against the code and contract, apply one item at a time, push back with evidence (`./references/feedback.md` or `harnix skill harnix-implement --reference feedback`). Stop and route on a new product or compatibility decision, a plan that contradicts evidence, a missing dependency or authority, a repeated unexplained failure, or a change that would overwrite user-owned content.

## Exit

- Resumable partial work: stay `in_progress` and report the checkpoint.
- Confirmed defect: `harnix-debug`. Requirement gap: replan via `harnix-plan`.
- Implementation and focused checks done: `--transition verifying/verifying`, hand to `harnix-verify`.

Never branch, commit, push or open a PR on your own; before a commit show the diff and message and wait for approval.
