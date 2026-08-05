# Harnix Agent Guide

## Mission

Build Harnix as a lean, project-local coding-agent harness for exactly Kiro, Antigravity, and Codex. The product is one npm package (`@tamtiger/harnix`), one executable (`harnix`), and one project-data namespace (`.harnix/`).

## Sources of truth

Read the smallest relevant set before changing files:

1. `docs/HARNIX_PRD.md` — product requirements and scope.
2. `docs/HARNIX_WORKFLOW.md` — canonical workflow, gates, transitions, and artifacts.
3. `docs/IMPLEMENTATION_PLAN.md` — frozen schemas, task order, tests, and acceptance commands.
4. `docs/HARNESS_RESEARCH.md` — adopted, adapted, deferred, and rejected behavior.
5. `docs/UPSTREAM_MAPPING.md` — source-to-Harnix ownership and removal mapping.
6. `docs/UPSTREAM_BASELINE.md` — frozen provenance, versions, licenses, and measurements.

When requirements conflict, follow PRD product behavior, then the canonical workflow for workflow details, then the implementation plan for frozen v1 schemas and execution order. A new explicit user instruction overrides the documents within its stated scope; update affected documents in the same change.

## Current state

- Documentation readiness has passed.
- Phase 1 implementation is complete; use its tests and contracts as the foundation for later phases.
- Continue from the first unchecked task in the active phase in `docs/IMPLEMENTATION_PLAN.md` unless the user changes priority; explicitly deferred Phase 4 extensions do not block earlier phases.
- Do not invent a second package, workspace, service, or compatibility surface.

## Non-negotiable product boundaries

- TypeScript ESM, Node.js `>=18`, pnpm, Commander.js, Inquirer, tsup, and Vitest.
- Exactly one publishable `package.json` and one `harnix` bin.
- Supported platforms are Kiro, Antigravity, and Codex only.
- Antigravity public identity/flag is `antigravity`/`--antigravity`; its executable is `agy`. The physical `.gemini` namespace does not make Gemini CLI a supported platform.
- Runtime code stays in the installed package. Never copy runtime scripts into consumer repositories.
- No telemetry, daemon, hosted service, marketplace, default MCP, global memory, or silent runtime network.
- No channel/forum/worker network, workflow-template switching, mandatory subagents, or automatic Git integration.
- Never auto-commit, branch, create a worktree, merge, push, publish, or create a PR.

## Architecture rules

Keep dependencies flowing in this direction:

```text
commands/configurators/migration -> core -> utils/pure types
commands -> terminal UI
configurators -> templates/rules/skills
core -X-> Commander/Inquirer/platform templates
```

- Inject filesystem, clock, process runner, version lookup, network, and prompt dependencies where deterministic tests need control.
- Use Node path/realpath APIs and executable-plus-argument arrays. Never concatenate untrusted shell input.
- Normalize persisted paths to repository-relative POSIX form and reject traversal, unsafe roots, and symlink/junction escape.
- Use atomic replacement for config, manifests, and task state.
- Preserve unrelated and user-modified content. Tasks, research, and journals are always user-owned.
- Do not expose machine-specific absolute paths, credentials, prompts, or secret values in generated output or diagnostics.

## Implementation workflow

Use the single state machine in `docs/HARNIX_WORKFLOW.md`. Lite and Full are ceremony levels, not separate workflows.

For each implementation task:

1. Confirm the relevant plan task, acceptance criteria, frozen schema, and affected files.
2. Inspect existing user changes before editing; do not overwrite unrelated work.
3. Write a meaningful failing test first for behavior changes.
4. Implement the smallest change that makes the focused test pass.
5. Refactor while green; avoid speculative abstractions and unsupported surfaces.
6. Run compliance review before quality/security review.
7. Run fresh focused verification, then the broader gate required by the phase.
8. Update `CHANGELOG.md` under `Unreleased` with user-visible implementation changes before committing.
9. Report actual evidence, omitted checks, residual risks, and next task. Do not claim success from stale or partial output.

Docs-only, trivial wiring, or generated snapshots may use the documented TDD exception, but must record the reason and use the strongest meaningful alternative verification.

For failures, reproduce, gather evidence, identify root cause, test one hypothesis, add regression protection, and fix. After three failed hypotheses for the same symptom, reassess assumptions or architecture and return to planning.

## Frozen v1 contracts

Do not alter field names, enums, paths, transitions, scoring, hook protocol, or exit semantics in `docs/IMPLEMENTATION_PLAN.md` section 4 without updating PRD, workflow, migration behavior, and tests in the same change.

Important adapter constraints:

- Kiro: project skills, steering, and one frozen `promptSubmit -> runCommand` context hook.
- Antigravity: v1 generates only managed `GEMINI.md` and `.gemini/skills/harnix-*`; do not generate unverified settings/hooks or touch user-level `.gemini` state.
- Codex: preserve text outside the managed `AGENTS.md` block; use repo `.agents/skills/harnix-*`, minimal structural `.codex/config.toml` merge, and exactly one `.codex/hooks.json` representation.

## Required package scripts

Task 1.1 must define:

```text
build
lint
typecheck
test
test:unit
test:integration
test:migration
test:platform
test:workflow
test:safety
test:acceptance
pack:check
smoke:tarball
measure:init
measure:footprint
scan:release
```

Do not weaken, bypass, or silently skip these gates. Filesystem tests use isolated temporary repositories and must not mutate global user configuration or call real install/network operations.

## Completion gate

Before reporting implementation complete, run the exact acceptance sequence in `docs/IMPLEMENTATION_PLAN.md` section 11 and read every exit code/output. Harnix is not complete until tarball smoke tests, platform parity, doctor fixtures, performance, footprint, safety, attribution, and release scans pass with fresh evidence.
