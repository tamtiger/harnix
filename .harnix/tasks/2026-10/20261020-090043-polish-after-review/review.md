# Tinh chỉnh sau review: catch rỗng, workflow.md và reference review đa góc nhìn

- **ID:** 20261020-090043-polish-after-review
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-20 09:00:43 +07:00
- **Updated:** 2026-10-20 09:06:34 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Thay catch rỗng ở epic.ts bằng hàm pathExists có sẵn, nối lại các dòng bị ngắt cứng giữa câu ở template workflow.md, và thêm reference multi-lens cho skill harnix-review để chạy review nhiều góc nhìn bằng subagent khi nền tảng hỗ trợ.

## Relevant paths

- `src/core/epics/epic.ts`
- `src/skills`
- `src/templates/harnix/workflow.md`
- `test/integration/commands/skills.test.ts`
- `test/unit/skills`
- `test/workflow/skill-sources.test.ts`

## Acceptance criteria

- [x] `ac-1` (met): epic.ts không còn khối catch rỗng: sự tồn tại của research.md và spec.md được kiểm bằng pathExists đã có trong file, hành vi trang epic.md giữ nguyên.
- [x] `ac-2` (met): Template workflow.md (và .harnix/workflow.md sinh từ nó) không ngắt dòng cứng giữa câu ở các đoạn đã sửa trong epic này.
- [x] `ac-3` (met): harnix skill harnix-review --reference multi-lens trả về hướng dẫn review nhiều góc nhìn (mã, test, tài liệu, bảo mật, phát hành), subagent chỉ là tùy chọn, SKILL.md của harnix-review trỏ tới reference, và các test catalog, skill-sources, instruction-budget xanh.
- [x] `ac-4` (met): pnpm run lint, typecheck và toàn bộ test suite pass.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-20 09:06:26 +07:00)
- [x] `chk-lint` (focused): Lint ESLint và Prettier phải exit 0 — pass (2026-10-20 09:05:10 +07:00)
- [x] `chk-focus` (focused): Test epic, skill catalog và skill sources — pass (2026-10-20 09:05:14 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 09:05:18 +07:00)

## Decisions

- **dec-1** — Chỉ nối lại các đoạn của template workflow.md mà epic này đã sửa, không nối toàn bộ file.
  - _Why:_ Nối cả file làm diff nhiễu lớn không cần thiết; người dùng có thể yêu cầu nối toàn bộ sau.

## Evidence

- `chk-lint` — pass (2026-10-20 09:05:10 +07:00): pnpm lint — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-focus` — pass (2026-10-20 09:05:14 +07:00): pnpm exec vitest run test/unit/core/epics test/unit/skills test/integration/commands/skills.test.ts test/workflow/skill-sources.test.ts test/workflow/instruction-budget.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-20 09:05:18 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-20 09:06:26 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
