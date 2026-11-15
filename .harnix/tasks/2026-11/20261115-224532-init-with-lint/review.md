# Sửa mô tả check suite và thêm cờ --with-lint opt-in

- **ID:** 20261115-224532-init-with-lint
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-15 22:45:32 +07:00
- **Updated:** 2026-11-15 23:05:50 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | r-fix-script: low |

## Goal

Mô tả check mặc định khớp lệnh thực chạy (chỉ test); workflow --init có cờ opt-in --with-lint thêm check bắt buộc check-lint chỉ-đọc, không đổi hành vi mặc định.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -0 |
| `package.json` | modified | +1 / -1 |
| `src/commands/workflow-command.ts` | modified | +1 / -0 |
| `src/commands/workflow-flag-owners.ts` | modified | +1 / -0 |
| `src/commands/workflow-flags.ts` | modified | +1 / -0 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +1 / -0 |
| `src/core/workflow/init-lint-check.ts` | added | - |
| `src/core/workflow/init-task.ts` | modified | +38 / -4 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/templates/harnix/workflow.md` | modified | +1 / -1 |
| `test/unit/core/workflow/init-lint-check.test.ts` | added | - |
| `test/unit/core/workflow/init-task.test.ts` | modified | +1 / -1 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +1 / -1 |
| `test/workflow/cli-contract.test.ts` | modified | +1 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Mô tả check mặc định (SUITE_DESCRIPTION) chỉ nói về test, đúng với lệnh test thực chạy.
- [x] `ac-2` (met): workflow --init --with-lint thêm check bắt buộc check-lint (scope full, khai báo trước check-suite, phủ mọi criterion) với lệnh lint của verify-plan theo --cwd; không có cờ thì danh sách check không đổi.
- [x] `ac-3` (met): Lệnh lint chứa token --fix hoặc --write không bao giờ được thêm làm check; thiếu lệnh lint thì không lỗi, không thêm check và có notice nêu cách sửa.
- [x] `ac-4` (met): Cờ --with-lint được khai báo đủ theo checklist thêm cờ workflow (command, flags, owners, handler, schema, golden, tài liệu) và có một dòng cookbook, trong trần token.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-15 23:01:35 +07:00)
- [x] `chk-init-lint` (focused): chk-init-lint — pass (2026-11-15 22:59:04 +07:00)
- [x] `chk-gates` (focused): chk-gates — pass (2026-11-15 22:59:16 +07:00)

## Decisions

- **d-optin** — Lint là opt-in (--with-lint), không mặc định
  - _Why:_ Review độc lập: không có sự cố thật, lint đỏ sẵn chặn task cũ, script --fix làm default thành no-op; đã có --with-check thủ công
- **d-scope-full** — check-lint scope full, khai báo trước check-suite
  - _Why:_ Ready gate chỉ đếm check focused; lint focused sẽ thỏa gate mà không có test hành vi

## Residual risks

- **r-fix-script** (low) — Guard chỉ xét token trong chuỗi lệnh, không đọc thân script package.json

## Evidence

- `chk-init-lint` — pass (2026-11-15 22:59:04 +07:00): pnpm exec vitest run test/unit/core/workflow test/unit/commands test/integration/commands/workflow-command.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-15 22:59:16 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-15 23:01:35 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
