# Plan: Sửa cảnh báo hook Codex

- [x] `CODEX-HOOK-SOURCE` — Chuyển contract Codex hook từ JSON member sang managed TOML block và ghi RED regression fixture.
- [x] `CODEX-HOOK-MIGRATION` — Implement reconcile/migration một nguồn, giữ nội dung user-owned và cập nhật doctor/uninstall/readiness.
- [x] `CODEX-DOCS-RELEASE` — Cập nhật docs, package patch version, CHANGELOG và chạy toàn bộ verification.

### Slice `CODEX-HOOK-SOURCE`

Criteria: `ac-codex-single-source` `ac-codex-preservation`
Checks: `codex-hook-focused`
Paths: `src/configurators/codex.ts` `src/utils/global-managed-files.ts` `test/platform/codex-global.test.ts` `test/platform/setup.test.ts`

Viết test RED cho config có `[hooks.state]` và kiểm tra setup/update chỉ có managed hook trong `config.toml`, không có `hooks.json` mới.

### Slice `CODEX-HOOK-MIGRATION`

Criteria: `ac-codex-migration` `ac-codex-preservation`
Checks: `codex-hook-focused` `codex-doctor-safety`
Paths: `src/commands/global-doctor.ts` `src/commands/global-uninstall.ts` `src/configurators/codex.ts` `src/utils/global-managed-files.ts` `test/integration/global-lifecycle.test.ts` `test/unit/global-uninstall.test.ts`

Implement migration từ JSON member cũ và test unchanged/modified/unrelated behavior, rollback và readiness.

### Slice `CODEX-DOCS-RELEASE`

Criteria: `ac-codex-release`
Checks: `acceptance-suite` `release-gates` `static-quality` `version-docs-sync`
Paths: `AGENTS.md` `README.md` `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` `docs/IMPLEMENTATION_PLAN.md` `package.json` `CHANGELOG.md`

Cập nhật tài liệu normative, version patch và changelog; chạy fresh compliance rồi quality/security/release gates.
