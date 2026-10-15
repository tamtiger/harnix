# Cải tiến CLI khởi tạo Epic, nạp file UTF-8, chuyển đổi task và DX

- **ID:** 20261015-213328-improve-epic-cli-preflight-and-skill-output
- **Mode:** full
- **Epic:** 20261015-213325-harnix-dx-workflow-friction-reduction
- **Status:** completed/finishing
- **Created:** 2026-10-15 21:33:25 +07:00
- **Updated:** 2026-10-16 00:00:09 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 7/7 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Hỗ trợ nạp cấu hình từ file (--file) cho save/batch/epic, phát hiện lỗi mất dấu text integrity, hỗ trợ resume --force và resume --next, bổ sung set-title/set-goal, hiển thị nextTask trong status/preflight và cờ raw cho skill.

## Relevant paths

- `src/commands/epic.ts`
- `src/commands/resume.ts`
- `src/commands/skills.ts`
- `src/commands/status.ts`
- `src/commands/workflow-flags.ts`
- `src/core/workflow/preflight.ts`
- `src/core/workflow/text-integrity.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Hỗ trợ nạp cấu hình Epic và Task từ file (--file) cho workflow --save, --batch, --migrate và khởi tạo Epic, loại bỏ rủi ro hỏng encoding từ stdin pipe.
- [x] `ac-2` (met): Bổ sung cơ chế phát hiện lỗi mất dấu tiếng Việt (lossy conversion ???) trong text-integrity.ts để chặn lưu dữ liệu hỏng.
- [x] `ac-3` (met): Hỗ trợ cờ --force và cờ --next cho harnix resume để kích hoạt task tiếp theo của epic một cách thuận tiện.
- [x] `ac-4` (met): Bổ sung cờ --set-title và --set-goal cho harnix workflow để cập nhật tiêu đề và mục tiêu nhanh chóng.
- [x] `ac-5` (met): harnix status và workflow --preflight gợi ý rõ ràng epicContext, nextTask và lệnh resume khi không có activeTask.
- [x] `ac-6` (met): harnix skill hỗ trợ cờ --raw để in trực tiếp nội dung Markdown ra terminal.
- [x] `ac-7` (met): .harnix/cache/ được đưa vào .gitignore mặc định và hiển thị log rõ ràng khi file quản lý thay đổi.

## Required checks

- [x] `check-suite` (full): Chạy toàn bộ test suite của Harnix — pass (2026-10-15 23:59:01 +07:00)
- [x] `check-gates` (focused): Kiem tra tap trung — pass (2026-10-15 23:59:33 +07:00)

## Evidence

- `check-gates` — pass (2026-10-15 23:59:33 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-15 23:59:01 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
