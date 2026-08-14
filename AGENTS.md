# Harnix Agent Guide

## Mission

Build Harnix as a lean coding-agent harness for exactly Kiro, Antigravity, and Codex. Project workflow data remains local in `.harnix/`; Phase 6 platform integrations are explicit, Harnix-owned **user-global** customizations. The product is one npm package (`@tamtiger/harnix`) and one executable (`harnix`).

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
- Phase 1–5 implementation is complete. Phase 6 is active; follow `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` from G0 onward.
- Continue from the first unchecked task in the active phase in `docs/IMPLEMENTATION_PLAN.md` unless the user changes priority; explicitly deferred Phase 4 extensions do not block earlier phases.
- Do not invent a second package, workspace, service, or compatibility surface.

## Non-negotiable product boundaries

- TypeScript ESM, Node.js `>=18`, pnpm, Commander.js, Inquirer, tsup, and Vitest.
- Exactly one publishable `package.json` and one `harnix` bin.
- Supported platforms are Kiro, Antigravity, and Codex only.
- Antigravity public identity/flag is `antigravity`/`--antigravity`; its executable is `agy`. The physical `.gemini` namespace does not make Gemini CLI a supported platform.
- Runtime code stays in the installed package. Never copy runtime scripts into consumer repositories.
- No telemetry, daemon, hosted service, marketplace, default MCP, global memory, or silent runtime network.
- User-global setup is limited to the documented Kiro, Antigravity, and Codex files. Never create `~/.harnix`, mutate real user homes in tests, or infer global ownership from a project manifest.
- No channel/forum/worker network, workflow-template switching, mandatory subagents, or automatic Git integration.
- Never auto-commit, branch, create a worktree, merge, push, publish, or create a PR.
- Before any commit, show the proposed changes and commit message, then wait for explicit user approval. A request to commit does not authorize skipping this review.

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
- Normalize project paths to repository-relative POSIX form and global paths to a verified platform root; reject traversal, unsafe roots, and symlink/junction escape.
- Use permission-preserving atomic replacement for config, manifests, task state, and shared global integration files.
- Preserve unrelated and user-modified content. Tasks, research, and journals are always user-owned.
- Do not expose machine-specific absolute paths, credentials, prompts, or secret values in generated output or diagnostics.

## Implementation workflow

Use the single state machine in `docs/HARNIX_WORKFLOW.md`. Lite and Full are ceremony levels, not separate workflows.

Luôn dùng tiếng Việt khi tạo và cập nhật task Harnix, gồm nội dung hướng người dùng trong `task.json`, `prd.md`, `plan.md`, `design.md`, research và journal. Giữ nguyên code identifier, command, đường dẫn, tên field/schema và trích dẫn nguồn khi cần để bảo đảm chính xác kỹ thuật.

For each implementation task:

1. Confirm the relevant plan task, acceptance criteria, frozen schema, and affected files.
2. Inspect existing user changes before editing; do not overwrite unrelated work.
3. Write a meaningful failing test first for behavior changes.
4. Implement the smallest change that makes the focused test pass.
5. Refactor while green; avoid speculative abstractions and unsupported surfaces.
6. Run compliance review before quality/security review.
7. Run fresh focused verification, then the broader gate required by the phase.
8. Before marking any task `completed`, increment the package patch version and update `CHANGELOG.md`; do this before completion persistence, not as a later follow-up.
9. Update `CHANGELOG.md` with user-visible implementation changes before committing.
10. Report actual evidence, omitted checks, residual risks, and next task. Do not claim success from stale or partial output.

Create new tasks as TaskRecord schema v2. Required checks must map `criterionIds` to acceptance criteria, declare safe sorted `inputs` including `@task-contract`, and persist passing `inputDigest` values through the hidden workflow snapshot/save path. Read v1 records unchanged; migrate only an unfinished v1 task with explicit authorization at checkpoint `replan`. On continuation, treat `contextDrift: stale` as a mandatory replan before context reselection.

Docs-only, trivial wiring, or generated snapshots may use the documented TDD exception, but must record the reason and use the strongest meaningful alternative verification.

For failures, reproduce, gather evidence, identify root cause, test one hypothesis, add regression protection, and fix. After three failed hypotheses for the same symptom, reassess assumptions or architecture and return to planning.

## Frozen contracts

Do not alter field names, enums, paths, transitions, scoring, hook protocol, or exit semantics in `docs/IMPLEMENTATION_PLAN.md` section 4 without updating PRD, workflow, migration behavior, and tests in the same change.

Phase 6 supersedes the former project-local platform paths while preserving the frozen project-data/task contracts. The detailed source is `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`.

Important adapter constraints:

- Public Harnix commands always emit JSON; do not add or require a `--json` flag.
- `harnix setup --kiro|--antigravity|--codex [--dry-run]` is user-global only. It must not resolve a project root or read `.harnix/config.yaml`.
- Kiro uses `~/.kiro/skills/harnix-*`, `~/.kiro/steering/harnix.md`, and one `~/.kiro/hooks/harnix-context.json` JSON-v1 `UserPromptSubmit` handler.
- Antigravity uses independent Desktop and CLI plugins below `~/.gemini/config/plugins/harnix` and `~/.gemini/antigravity-cli/plugins/harnix`; never write MCP/settings/credentials.
- Codex uses `$HOME/.agents/skills/harnix-*`, a managed conditional block in `$CODEX_HOME/AGENTS.md`, and a nested `$CODEX_HOME/hooks.json` handler. Do not write `config.toml`; preserve unrelated text/handlers. Report `installed-pending-trust` until the user reviews the hook in `/hooks`.
- Each platform root owns a separate validated sidecar manifest. Reconcile only unchanged Harnix fragments, preserve collisions/modified content, lock in stable order, and rollback conservatively.
- `update --global`, `doctor --fix --global`, and `uninstall --global ... --yes` operate on global integrations. `uninstall --purge --yes` remains project-only. Legacy project surfaces require explicit `--legacy-project-surfaces [--yes]` cleanup.
- The hidden `harnix internal context` command must be a fast, no-write/no-network no-op outside an initialized project. Global instructions and hooks must include the same activation guard.

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

Do not weaken, bypass, or silently skip these gates. Filesystem tests use isolated temporary repositories **and injected disposable user homes**; they must not mutate real global configuration or call real install/network operations.

## Completion gate

Before reporting implementation complete, run the exact acceptance sequence in `docs/IMPLEMENTATION_PLAN.md` section 11 and read every exit code/output. Phase 6 additionally requires fake-home tarball smoke and the documented disposable-profile manual smoke; a real user profile is never touched without explicit authorization. Harnix is not complete until platform parity, doctor v2 fixtures, performance, footprint, safety, attribution, and release scans pass with fresh evidence.
