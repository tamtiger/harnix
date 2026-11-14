# Hint và kiểm kiểu cho các lỗi flag workflow agent hay gặp

- **ID:** 20261113-220244-workflow-error-hints
- **Mode:** lite
- **Epic:** 20261113-220240-harnix-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 22:02:39 +07:00
- **Updated:** 2026-11-13 22:29:27 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Các lỗi agent hay gặp khi dùng harnix workflow nêu rõ cách thoát và không lộ lỗi nội bộ.

## Non-goals

- Không thêm hint cho toàn bộ 255 điểm throw; chỉ nhóm lỗi đã có bằng chứng.

## Relevant paths

- `src/core/workflow/save.ts`
- `src/core/workflow/obligations.ts`
- `src/commands/workflow-lifecycle-handlers.ts`
- `src/commands/workflow-flags.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/commands/workflow-flags.ts` | modified | +3 / -1 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +13 / -2 |
| `src/core/doctor/finding-codes-global.ts` | modified | +1 / -0 |
| `src/core/doctor/finding-codes-project.ts` | modified | +1 / -0 |
| `src/core/doctor/global-inspect.ts` | modified | +8 / -4 |
| `src/core/doctor/global-linked.ts` | added | - |
| `src/core/doctor/global.ts` | modified | +60 / -21 |
| `src/core/doctor/project-runtime.ts` | modified | +19 / -3 |
| `src/core/global/uninstall.ts` | modified | +4 / -1 |
| `src/core/workflow/actions.ts` | modified | +1 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +3 / -1 |
| `src/core/workflow/obligations.ts` | modified | +3 / -1 |
| `src/core/workflow/plan-edit.ts` | modified | +3 / -1 |
| `src/core/workflow/run-check.ts` | modified | +4 / -0 |
| `src/core/workflow/save.ts` | modified | +4 / -1 |
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
| `test/integration/commands/workflow-error-hints.test.ts` | added | - |
| `test/unit/commands/workflow-lifecycle-handlers.test.ts` | modified | +17 / -0 |
| `test/unit/core/doctor/global-inspect.test.ts` | modified | +28 / -1 |
| `test/unit/core/doctor/global-linked.test.ts` | added | - |
| `test/unit/core/doctor/global.test.ts` | modified | +11 / -0 |
| `test/unit/core/doctor/project-runtime.test.ts` | modified | +16 / -1 |
| `test/unit/core/global/uninstall.test.ts` | modified | +32 / -1 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Lỗi --init khi đang có task active, lỗi --run-check ở planning rồi sửa obligations, và các lỗi thiếu cờ đi kèm (--add-criterion thiếu --check, --add-decision thiếu --rationale, --evidence thiếu --exit-code) đều có hint nêu lệnh sửa (UX-01, UX-02, UX-03).
- [x] `ac-2` (met): --init --file kiểm kiểu payload (ví dụ checks không phải mảng) và trả lỗi chuẩn có hint thay vì lỗi nội bộ (A3).
- [x] `ac-3` (met): --cancel chấp nhận hoặc mặc định --brief, hoặc khối luôn nạp bỏ câu thêm --brief cho mọi lệnh ghi; cách chọn được ghi thành decision (UX-04).

## Required checks

- [x] `chk-focused` (focused): Test workflow handlers, hint và hợp đồng CLI — pass (2026-11-13 22:27:31 +07:00)
- [x] `chk-gates` (focused): Các test hợp đồng nhanh (CLI, tài liệu, cấu trúc test, ngân sách token, golden) — pass (2026-11-13 22:27:41 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-11-13 22:29:24 +07:00)

## Decisions

- **dec-source** — Nguồn của task: báo cáo review toàn bộ Harnix ngày 2026-11-13 (research.md của epic).
  - _Why:_ Mỗi tiêu chí là một phát hiện đã được nhóm review nêu kèm file:dòng; phải đối chiếu lại với mã hiện tại trước khi chuyển sang ready.
- **dec-tdd-exception** — Hint của lỗi workflow thêm sau code, test viết ngay sau.
  - _Why:_ Chỉ đổi câu chữ thông báo (ngoại lệ TDD: văn bản), kiểm chứng bằng test tích hợp mới kiểm hint và golden chỉ đổi đúng chuỗi mới.

## Evidence

- `chk-focused` — pass (2026-11-13 22:27:31 +07:00): pnpm exec vitest run test/unit/commands/workflow-handlers.test.ts test/workflow/cli-contract.test.ts --coverage.enabled=false — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-13 22:27:41 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-13 22:29:24 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
