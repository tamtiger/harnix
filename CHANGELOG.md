# Changelog

Mọi thay đổi đáng chú ý của Harnix được ghi tại đây.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Harnix chưa có bản phát hành npm; các mục dưới đây theo commit cho đến khi versioning/release workflow được triển khai.

## [0.6.8] - 2026-08-13

### Changed

- Workflow routing now explicitly distinguishes requested action, work kind, mutation scope, risk, active state, and stage owner; standalone code review stays read-only while review-and-fix enters the normal task lifecycle.
- Added hidden JSON-only workflow inspect/save/finish operations with legal transition, evidence-preservation, Full-artifact, completion-journal, and active-pointer safeguards.
- Task and Doctor integrity checks now validate status/checkpoint and evidence relationships, report historical task/journal drift without rewriting it, and retain completed records whose transient artifact paths are no longer safe.
- Generated consumer instructions use the repository's own release instruction instead of imposing Harnix package-version or changelog rules.

## [0.6.7] - 2026-08-13

### Fixed

- Fixed `harnix init` failing on valid mixed-case or locale-sensitive repository paths when creating the repository-map cache.

## [0.6.6] - 2026-08-13

### Changed

- Generated project `AGENTS.md` now explains safe cache-only `repo-map` discovery, Doctor repair, and the prohibition on invoking repository-map operations from platform hooks.

## [0.6.5] - 2026-08-13

### Added

- Fresh `harnix init` now creates the safe repository-map cache, and `harnix repo-map --query <text> [--limit <count>]` provides a short cache-only query command.

### Changed

- Public commands now always emit JSON and no longer require or expose a redundant `--json` flag.

## [0.6.4] - 2026-08-13

### Changed

- Commit requests now require a displayed change summary and proposed commit message followed by explicit user approval before staging or committing.

## [0.6.3] - 2026-08-13

### Changed

- README and generated project `AGENTS.md` now document the required patch-version and changelog update before every task completion.

## [0.6.2] - 2026-08-13

### Changed

- Every completed Harnix task now increments the package patch version and updates this changelog before its task record is persisted as completed.
- Added a disposable, deterministic repository-map cache with safe inventory, structural-only lexical retrieval, hidden refresh/query operations, and project Doctor repair; platform hook fast paths remain read-only and unchanged.

## [0.6.1] - 2026-08-13

### Changed

- Generated project `AGENTS.md` bootstrap no longer includes Harnix begin/end markers; the independent marker-based Codex user-global reconciliation contract is unchanged.
- Stack profiling is moving to config v2 with independent source-language and typed technology IDs, explicit no-rescan v1 migration, bounded explainable detector evidence, and a metadata-driven guide catalog. The frozen contract prevents framework/runtime markers from overclaiming source languages and preserves compatible unknown configuration fields.
- Detection also ignores agent/tooling namespaces, preventing their hooks and helper scripts from being persisted as consumer-project language evidence.

## [0.6.0] - 2026-08-12

### Changed

- Seven Harnix workflow skills now have canonical `src/skills/harnix-*/SKILL.md` sources adapted from the frozen Trellis, ECC, and Superpowers baselines. They restore decision-complete ready review, critical plan review, observed RED–GREEN–REFACTOR, root-cause debugging, claim-to-evidence verification, safe resume/finish behavior, and byte-identical Kiro/Antigravity/Codex installation without mandatory worktrees, subagents, commits, branches, pushes, or pull requests.
- `harnix init` now detects Composer and PHP source projects, records the `php` profile language, and seeds PHP-specific engineering guidance.
- `harnix init` is now zero-option and non-interactive by default, inferring the developer journal ID from the OS user and auto-detecting the stack; `--user` and `--languages` remain optional overrides while the old `--yes` flag is a hidden no-op compatibility alias.
- Init output now reports project status, selected developer/languages, and sorted per-path `created`, `updated`, `unchanged`, `preserved`, and warning arrays.
- New projects no longer contain the redundant `.developer` file or empty `tasks/` and `workspace/<developer>/` placeholders; task and journal writers create their namespaces lazily.
- Generated common and C#/.NET/ABP guides now contain actionable architecture, security, persistence, cancellation, testing, and verification rules; the project workflow template now includes routing, ready-gate, implementation, and two-stage verification guidance.
- Generated workflow and AGENTS bootstrap instructions now resolve the nearest initialized project ancestor or workspace root, so nested working directories follow the same activation guard as global integrations.
- Generated `AGENTS.md` now places Harnix version and project-local workflow/task/guidance/diagnostic scope above the workflow, and adds a concise `Project profile` with configured languages and package paths; it does not use a “Detected repository” heading.
- Self-hosted workflow instructions and global skills now declare incoming state, persistence boundaries, and exit handoffs; project profiles are discovery seeds rather than complete repository truth, and research artifacts retain remaining uncertainty.

## [0.5.0] - 2026-08-11

### Added

- User-global setup refactor plan with current official Kiro, Antigravity, and Codex paths, hook schemas, ownership isolation, migration, security, and acceptance gates.
- User-global Harnix integrations for Kiro, Antigravity Desktop/CLI and Codex, with namespaced skills, rules/instructions, current hook schemas and independently owned manifests per platform root.
- Explicit global lifecycle: `setup`, `update --global`, Doctor JSON v2/global repair, scoped global uninstall, and manifest-backed cleanup for only safe standalone legacy project surfaces.
- Isolated-home tarball/release fixtures, Windows `.cmd` launcher coverage, collision/rollback/lock regressions, and a cold non-Harnix hook performance gate.
- Phase 5 regression coverage for legacy-data migration, managed setup/uninstall ownership, workflow completion, CLI exit/redaction behavior, doctor findings, path containment, and concurrent journal writes.
- Repository review and remediation roadmap in `docs/REVIEW_REFACTOR_PLAN.md`.
- README usage guide covering installation, quick start, CLI flags, platform setup, workflow, CI and troubleshooting-oriented lifecycle commands.
- `harnix init` now seeds a root `AGENTS.md` bootstrap that explains CLI versus skill responsibilities, Bypass/Lite/Full routing, skill order, persisted states, recovery, safety rules, and verification expectations.

### Changed

- Package metadata, build-time CLI metadata và generated manifests nay cùng lấy version `0.5.0` từ một nguồn `package.json`.
- `setup` now runs from any directory and installs only explicit user-global platform integrations; `init` remains project-local and creates only `.harnix` data.
- Package metadata and CLI help now distinguish project-local workflow data from user-global platform integrations.
- Global reconciliation preserves unrelated, untracked and user-modified content; it preflights all selected roots, uses stable locks and reports safe drift instead of overwriting collisions.
- The packaged CLI uses a lean canonical `internal context` fast path, keeping a non-Harnix Antigravity hook no-op output-free while meeting the cold-start release threshold.
- Test coverage is organized by behavior and boundary (`workflow`, `support`, focused core/lifecycle files) instead of historical Phase-labelled files.
- Phase 5 now refuses staged legacy-content mismatches before activation or cleanup, preserves modified obsolete-template ownership deterministically, preflights destructive uninstall paths, protects `.harnix` and task-state paths from symlink/junction escapes, and keeps customized Harnix instruction blocks intact on first platform setup.
- `harnix init` now always creates the `.harnix/` namespace regardless of existing Trellis folders or skills; it no longer exposes legacy migration through the init flow.
- CLI entry-point detection now resolves symlinked pnpm global installs before comparing module paths, so `harnix` executes normally after `pnpm add -g .` on Windows.
- README now documents pnpm 11 global CLI registration from source, `PNPM_HOME`/`PATH` recovery on PowerShell, project-local execution, and the unpublished npm-package limitation.
- README now documents the fail-safe legacy Trellis migration flow, what `--migrate` transfers, and why old Trellis skills remain until explicit cleanup.
- Setup, update, and uninstall now preserve user-modified platform files and injected blocks, reconcile obsolete ownership safely, retain unrelated Codex hook keys, and prevent removed platforms from being recreated.
- Migration now inventories and hash-verifies legacy specs, tasks, and journals in staging before activation; explicit cleanup removes only discovered verified legacy roots.
- Workflow/task validation now persists completion before archive, honors the latest required evidence, clears resumed blockers, and rejects incomplete completed records.
- CLI automation now preserves language detection, avoids non-TTY prompts, supports stable doctor JSON/exit semantics, consumes validated hook-event `cwd`, and redacts project paths from errors.
- Context and journal processing now normalize/deduplicate inputs, disclose unsafe or omitted sources, bound retained search results, and serialize concurrent in-process appends.
- Doctor and release scanning now cover deterministic lifecycle drift, hooks, injections, sensitive values, attribution, packaged output, and isolated generated fixtures.
- Detection ignores additional generated/cache trees, excludes React Native-only projects, and uses bounded directory traversal; init performance measurement now uses a representative Vue/Nest monorepo fixture.
- Platform rendering is separated into Kiro, Antigravity, and Codex configurators, and package version metadata has one build/runtime source.

### Security

- Project writes and destructive lifecycle operations now preflight repository containment and reject traversal plus symlink/junction escapes.
- User-global writes are anchored to verified user roots, never use a real profile in automated tests, and preserve concurrent editor changes during managed transactions.
- Runtime dependency audit remains clean. The single Low development-only esbuild advisory is explicitly risk-accepted until tsup publishes a compatible patched range; Harnix never invokes esbuild's affected development server, and adding a pnpm workspace solely for an override would violate the one-package/no-workspace product contract.

## [0.4.0] - 2026-08-07

### Added

- Phase 4 lifecycle commands: managed `update` with explicit restore, offline-by-default upgrade planning, safe uninstall/purge confirmation, journal `mem`, and deterministic `doctor --fix` reporting.
- Staged legacy migration with preview, conflict detection, atomic activation, verification, and opt-in legacy cleanup.
- Managed ownership now preserves user-modified/deleted files without re-baselining them; setup records Harnix-owned platform templates for safe later lifecycle operations.
- Packaging/release gates now inspect tarball contents, smoke install the tarball for every supported platform combination, measure init/footprint, and scan release output for secrets, machine paths, one-package, and one-bin invariants.

## [0.3.0] - 2026-08-07

### Added

- Phase 3 workflow and platform parity: managed workflow/skills, research/debug/verification guards, bounded internal context hooks, Codex adapter parity, and Kiro/Antigravity project-local setup.

## [0.2.0] - 2026-08-07

### Added

- Phase 2 completed: managed manifest rollback, full TaskRecord v1 validation, context ranking/persistence, learning promotion proposals, rule attribution, and 53-test acceptance verification.
- Phase 2 foundation: managed-file hashing/ownership, versioned task validation and transitions, bounded ranked context, journal search, and learning-candidate scoring.
- Phase 2 task artifacts: active-task persistence, validated context manifests, Lite/Full task artifact rules, and managed ownership reconciliation.
- Detection cục bộ, deterministic cho C#/.NET/ABP, NestJS, Python, Java/Spring, Go, React, Vue và monorepo.
- Discovery package manager và verification script chỉ đọc; bỏ qua dependency/generator tree và không thực thi script dự án.
- Config YAML Harnix v1: validation schema, canonical sorting, safe package path, reject future schema và preserve compatible unknown keys.
- Init core idempotent tạo `.harnix` project data; legacy `.trellis`/`.trellis-pro` được preview no-write khi chưa yêu cầu migrate.
- Public CLI `init`/`setup`; Kiro và Codex project-local setup idempotent, Antigravity được nhận diện nhưng chưa sinh hook/settings v1.
- Init test coverage cho config preservation, dry-run và performance; Kiro steering chỉ nạp ngôn ngữ đã detect.
- `pack:check` tạo và kiểm tra đúng một tarball Harnix trong `.artifacts`.
- `init` hỗ trợ prompt interactive có test injection, đồng thời giữ automation flags cho CI.
- Codex setup merge giữ lại `UserPromptSubmit` do người dùng sở hữu và thay thế duy nhất Harnix hook.
- Phase 1 hoàn tất: fresh `pnpm install --frozen-lockfile --ignore-scripts`, build, lint, typecheck, 44 test, `test:acceptance`, `pack:check`, branding scan và `git diff --check` đều pass.

## [0.1.0] - 2026-08-05

### Added

- Documentation baseline: PRD, workflow chuẩn, implementation plan, upstream baseline, research và mapping.
- Hướng dẫn cho coding agent và README tiếng Việt.
- Package TypeScript ESM `@tamtiger/harnix`, binary `harnix`, toolchain pnpm/tsup/Vitest/ESLint và lockfile.
- CLI help/usage tối thiểu, license AGPL-3.0, NOTICE và các script gate đã được khóa.
- Primitive an toàn cho normalized project path, Git-root discovery, containment qua symlink/junction và atomic write.
- Unit tests cho packaging invariant, path safety và rollback khi atomic replacement lỗi.
- Changelog theo Keep a Changelog, link từ README và quy tắc bắt buộc cập nhật `Unreleased` trước mỗi commit implement.

### Security

- Không tạo `pnpm-workspace.yaml`; chỉ một publishable package được kiểm thử.
- `.gitignore` loại trừ dependency, build output, artefact và pnpm store cục bộ.

## [Documentation baseline] - 2026-08-05

### Added

- Quyết định sản phẩm Harnix, contract v1, workflow và provenance upstream được chốt tại commit `d01239f`.

[0.6.7]: https://github.com/tamtiger/harnix/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/tamtiger/harnix/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/tamtiger/harnix/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/tamtiger/harnix/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/tamtiger/harnix/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/tamtiger/harnix/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/tamtiger/harnix/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/tamtiger/harnix/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/tamtiger/harnix/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/tamtiger/harnix/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tamtiger/harnix/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tamtiger/harnix/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tamtiger/harnix/commits/main
[Documentation baseline]: https://github.com/tamtiger/harnix/commit/d01239f
