# Xác minh facts nền tảng trên profile dùng thử và cập nhật facts.ts

- **ID:** 20261113-220245-platform-facts-verification
- **Mode:** lite
- **Epic:** 20261113-220240-harnix-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 22:02:39 +07:00
- **Updated:** 2026-11-13 22:36:47 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Các rủi ro tương thích còn là suy luận được kiểm chứng trên một profile dùng thử, và facts.ts, setupNotice, doctor phản ánh kết quả.

## Non-goals

- Không chạm profile thật của người dùng; không thêm hook Cursor và không dùng beforeSubmitPrompt.

## Relevant paths

- `src/core/platform/facts.ts`
- `src/core/platform/records.ts`
- `src/configurators`

## Relevant specs

- `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +3 / -3 |
| `CHANGELOG.md` | modified | +24 / -0 |
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
| `src/core/platform/facts.ts` | modified | +2 / -2 |
| `src/core/platform/records.ts` | modified | +1 / -1 |
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

- [x] `ac-1` (met): Kết quả kiểm chứng được ghi thành decision cho: Cursor liệt kê trùng harnix-* và hook Claude chạy trong Cursor, đường dẫn plugin Antigravity và hook PreInvocation, hook global của Kiro (S6); mục nào không thể chạy thử trên máy này (thiếu ứng dụng hoặc đăng nhập) được ghi rõ là chưa kiểm chứng thay vì suy đoán.
- [x] `ac-2` (met): facts.ts được cập nhật theo kết quả (ví dụ thêm SessionStart cho Antigravity), kèm ngày kiểm; setupNotice hoặc finding doctor được thêm khi xác nhận có rủi ro.

## Required checks

- [x] `chk-focused` (focused): Test platform registry, facts và configurators — pass (2026-11-13 22:32:04 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-11-13 22:34:04 +07:00)

## Decisions

- **dec-source** — Nguồn của task: báo cáo review toàn bộ Harnix ngày 2026-11-13 (research.md của epic).
  - _Why:_ Mỗi tiêu chí là một phát hiện đã được nhóm review nêu kèm file:dòng; phải đối chiếu lại với mã hiện tại trước khi chuyển sang ready.
- **dec-antigravity-paths** — agy 1.5.6 plugin list (profile dùng thử) chỉ thấy plugin ở ~/.gemini/config/plugins/harnix, không thấy ở ~/.gemini/antigravity-cli/plugins/harnix; hook plugin chỉ có tài liệu cho CLI.
  - _Why:_ Thử trực tiếp 3 trường hợp (chỉ desktop, chỉ cli, cả hai) trong profile tạm; mới kiểm tra discovery, chưa chạy phiên có đăng nhập nên chưa biết hook có chạy. Giữ cả hai gốc vì phiên bản agy cũ có thể dùng gốc CLI.
- **dec-cursor-not-run** — Cursor (trùng skill harnix-*, hook Claude chạy trong Cursor và stdout hợp lệ) chưa kiểm chứng thực nghiệm.
  - _Why:_ Máy không cài Cursor nên chỉ có suy luận từ tài liệu; để mở, cần chạy trên máy có Cursor với profile tạm trước khi đổi bất kỳ hành vi nào.
- **dec-kiro-not-run** — Hook global ~/.kiro/hooks của Kiro chưa kiểm chứng thực nghiệm; giữ ghi chú documented limit.
  - _Why:_ Chỉ có kiro-cli, chưa có phiên Kiro có đăng nhập để thấy hook chạy; tài liệu hook global chỉ xác nhận cho CLI V3.

## Evidence

- `chk-focused` — pass (2026-11-13 22:32:04 +07:00): pnpm exec vitest run test/unit/core/platform test/platform --coverage.enabled=false — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-13 22:34:04 +07:00): pnpm test — exit 0
