---
name: harnix-self-host
description: Use when changing the Harnix repository itself, for contract tests, version bump, self-host sync and the mandatory documentation synchronization before verifying.
---

# Working on the Harnix repository

Repository-only steps that the served `harnix-*` skills no longer name. `AGENTS.md` is the source of truth; this skill is its checklist.

## Contract tests

A task that changes the CLI, documentation or test structure adds a focused required check `pnpm run test:gates` (the contract tests, in seconds) beside its own tests, so the suite does not find those gaps last.

## Release preparation

Bump the version once, during implementation and before `verifying`, with `pnpm version:sync <version> --summary <text> [--kind added|changed|fixed]` (a standalone task bumps the patch; a member of an epic bumps `X.Y.0-dev.N`; the epic-closing release adds `--fold-dev` and needs no `--summary`: the dev entries already describe it). After editing the packaged `workflow.md` template run `pnpm selfhost:sync`. `measure:footprint` has no byte budget; keep the token budgets of skills and references (`instruction-budget`) instead.

## Documentation synchronization (MANDATORY)

Immediately after implementation and BEFORE transitioning to `verifying`, synchronize every document the change affects without waiting for a reminder:

1. `README.md`: new features, CLI commands, flags and usage examples.
2. `AGENTS.md`: operational guidance and agent instructions.
3. Templates and platform rules: `src/templates/harnix/agents.ts`, `src/templates/harnix/activation.ts`, `src/templates/harnix/global-surface.ts`.
4. Skills: `SKILL.md` and `references/` when workflows, conventions or behaviors evolve.
5. Canonical workflow and specs: `docs/HARNIX_WORKFLOW.md`, `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `.harnix/workflow.md`; run `pnpm selfhost:sync` whenever workflow templates change.
