# Giảm nhiễu khi capture learning bằng bộ lọc chất lượng

- **ID:** 20261013-095413-learning-capture-quality
- **Mode:** lite
- **Epic:** 20261013-095411-harnix-learning-overhaul
- **Status:** completed/finishing
- **Created:** 2026-10-13 09:54:11 +07:00
- **Updated:** 2026-10-13 13:55:21 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | r-min-length: low |

## Goal

Chỉ capture ghi chú tái sử dụng được: lọc độ dài tối thiểu, chuỗi không dấu hoặc chuỗi test, ghi chú gắn chặt id hoặc đường dẫn task; ưu tiên residualRisks và decision tường minh; có cách dọn draft rác hiện có mà vẫn giữ journal append-only.

## Non-goals

- Không sửa hay xoá dòng journal cũ
- Không nới learning-safety

## Relevant paths

- `src/commands/learning.ts`
- `src/core/journal/learning-capture.ts`
- `src/core/journal/learning-notes.ts`
- `src/core/journal/learning-summary.ts`
- `test/unit/core/journal`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [x] `ac-1` (met): Mục quá ngắn (dưới 40 ký tự) hoặc chỉ gồm chuỗi test không còn được capture, mục gắn id task xếp sau khi nạp vào prompt, có test với fixture nhiễu
- [x] `ac-2` (met): Lệnh harnix learning --prune [--apply] liệt kê rồi từ chối draft rác hiện có bằng entry rejected mới, journal cũ không bị sửa
- [x] `ac-3` (met): learning-safety và nhãn untrusted giữ nguyên hành vi

## Required checks

- [x] `check-capture` (focused): Test bộ lọc capture và dọn draft — pass (2026-10-13 13:53:52 +07:00)
- [x] `check-gates` (focused): Contract tests — pass (2026-10-13 13:53:57 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-10-13 13:55:13 +07:00)

## Decisions

- **d-scope-b** — Member B chỉ chặn mục dưới 40 ký tự và chuỗi kiểm thử, không chặn theo không dấu, giảm ưu tiên mục gắn task cụ thể.
  - _Why:_ 24 mục không dấu vẫn có giá trị; chặn cứng sẽ mất bài học thật.
- **d-prune** — Dọn draft rác bằng harnix learning --prune [--apply] (xem trước khi không có --apply), dùng lại reviewLearning reject; không thêm lệnh mới.
  - _Why:_ Journal append-only; từ chối bằng entry mới, cùng mô hình với --promote --apply.

## Residual risks

- **r-min-length** (low) — Ngưỡng 40 ký tự có thể chặn ghi chú ngắn nhưng có giá trị; chỉnh MIN_LEARNING_CHARACTERS nếu thấy mất bài học thật

## Evidence

- `check-capture` — pass (2026-10-13 13:53:52 +07:00): pnpm exec vitest run test/unit/core/journal test/integration/commands/learning.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-gates` — pass (2026-10-13 13:53:57 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-13 13:55:13 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
