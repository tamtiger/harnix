---
name: harnix-self-host
description: Use when changing the Harnix repository itself, for contract tests, version bump, self-host sync and the mandatory documentation synchronization before verifying.
---

# Working on the Harnix repository

Repository-only steps that the served `harnix-*` skills no longer name. `AGENTS.md` is the source of truth; this skill is its checklist.

## Contract tests

A task that changes the CLI, documentation or test structure adds a focused required check `pnpm run test:gates` (the contract tests, in seconds) beside its own tests, so the suite does not find those gaps last.

## Release preparation

Bump the version once, during implementation and before `verifying`, with `pnpm version:sync <version> --summary <text> [--kind added|changed|fixed]` (a standalone task bumps the patch; a member of an epic bumps `X.Y.0-dev.N`; the epic-closing release adds `--fold-dev`). After editing the packaged `workflow.md` template run `pnpm selfhost:sync`. A footprint over `scripts/footprint-budget.json` is first reduced by merging references; the budget is raised only by the measured shortfall with the reason in `CHANGELOG.md`.

## Documentation synchronization (MANDATORY)

Immediately after implementation and BEFORE transitioning to `verifying`, synchronize every document the change affects without waiting for a reminder:

1. `README.md`: new features, CLI commands, flags and usage examples.
2. `AGENTS.md` and rules: operational guidance, agent instructions and platform rules (`rules/AGENTS.md`).
3. Templates: `src/templates/AGENTS.md`, `src/templates/harnix/activation.ts`, `src/templates/harnix/agents.ts`.
4. Skills: `SKILL.md` and `references/` when workflows, conventions or behaviors evolve.
5. Canonical workflow and specs: `docs/HARNIX_WORKFLOW.md`, `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `.harnix/workflow.md`; run `pnpm selfhost:sync` whenever workflow templates change.
