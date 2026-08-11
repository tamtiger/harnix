# Changelog

Mọi thay đổi đáng chú ý của Harnix được ghi tại đây.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Harnix chưa có bản phát hành npm; các mục dưới đây theo commit cho đến khi versioning/release workflow được triển khai.

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

[0.5.0]: https://github.com/tamtiger/harnix/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/tamtiger/harnix/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tamtiger/harnix/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tamtiger/harnix/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tamtiger/harnix/commits/main
[Documentation baseline]: https://github.com/tamtiger/harnix/commit/d01239f
