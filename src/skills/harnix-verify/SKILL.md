---
name: harnix-verify
description: Use when a Harnix task needs fresh compliance, correctness and security verification, evidence, and a safe finish or explicit cancellation with an evidence-based handoff.
metadata:
  version: "2.0.3"
---

# Verify and finish Harnix work

Evidence precedes claims. Verify compliance first, then quality and security; read every result and keep failures.

## Start

The guard and state rules are in the always-loaded Harnix block. Run `harnix workflow --preflight`; `nextStage: verify` is yours (also a `completed` or `cancelled` task whose pointer is not yet cleared). Persist `harnix workflow --transition verifying/verifying` before the first check. A blocked task: read its blocker, resolve it or report it, continue at its resume status. Only TaskRecord schema v3 tasks are verified: an unfinished legacy v1/v2 task goes to `harnix-plan` for migration first. Standalone review of code without a task is `harnix-review`.

## Stage 1: compliance

Read the request, goal and non-goals, PRD/plan, guides and the diff. A Full `plan.md` checklist must be 100% `[x]` (a Lite task has none). For every criterion identify the changed files, the observable behavior, the fresh evidence and the actual outcome; `met` only with evidence, `waived` only with a reason and authority. Check scope, migration and compatibility, user-owned content, public output and docs. A compliance defect stops here: code defects go to `harnix-debug`, requirement defects to a replan via `harnix-plan`.

## Stage 2: quality and security

Inspect check state once. Reuse a required pass whose `inputDigest` still matches; run affected tests first (discover via `harnix repo-map --tests <path>`), then pending, failed, stale or affected checks, and the package suite; never run the same check twice for one digest in one request. Run a check with `harnix workflow --run-check <id> -- <exe> [args...]` (manual and compound forms: `./references/evidence.md` or `harnix skill harnix-verify --reference evidence`). Read the full output and exit code. Review correctness and regression coverage, meaningful tests, type/lint/build output, dependency direction, input/path/command/credential boundaries, atomicity and permissions, and cross-layer error flow. A focused pass never replaces a required full gate.

Only acceptance violations, required-gate failures and material correctness, security, data-loss or compatibility defects block completion; batch them, allow one remediation round, rerun only affected evidence. A second failure with the same check, digest and exit code stops automatic work. Low findings become `harnix workflow --add-risk`. If a failed check must be replaced with a focused or corrected check, use `harnix workflow --replace-check <old> <new> --reason "..."` to atomically retire the old failed check and activate the replacement with full criterion coverage.

## Record

Append each result with `--run-check` or `--evidence --check <id> --result <r> --summary <t> --exit-code <n>`; mark criteria with `--criterion <ids> --met`; keep failed evidence. Stay `verifying` while anything required is failed, missing, stale or unread.

## Technique skills

Use native agent skills on demand (load via `harnix skill <name>`):

- Verification blind spots: `harnix skill harnix-verification-gap` detects weak assertions and false-success tests.
- Security and boundary review: `harnix skill harnix-security-lens` checks injection, path traversal and secret leakage.

## Finish

When every criterion is met or waived and every required check is fresh: `--transition verifying/finishing`, record reusable lessons with `--add-risk` / `--add-decision`, then run `harnix workflow --finish --brief` exactly once. It recomputes every digest and captures learning; read `learning.captured` and act on `learning.hint` when it is 0. Finish never edits the product. Details, recovery and cancellation: `./references/finish-cancel.md` (or `harnix skill harnix-verify --reference finish-cancel`).

Report the outcome first, then the evidence, omitted checks and residual risks. For an epic member also report progress (`harnix epic <id>`) and recommend the next task; point to `review.md` for a plain summary. Never branch, commit, push or open a PR; before a commit show the diff and message and wait for approval.
