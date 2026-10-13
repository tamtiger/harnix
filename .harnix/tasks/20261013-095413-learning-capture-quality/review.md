# Giảm nhiễu khi capture learning bằng bộ lọc chất lượng

- **ID:** 20261013-095413-learning-capture-quality
- **Mode:** lite
- **Epic:** 20261013-095411-harnix-learning-overhaul
- **Status:** planning/planning
- **Created:** 2026-10-13 09:54:11 +07:00
- **Updated:** 2026-10-13 10:00:07 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/3 met or waived |
| Required checks | 0% | 0/3 passed |

## Goal

Chỉ capture ghi chú tái sử dụng được: lọc độ dài tối thiểu, chuỗi không dấu hoặc chuỗi test, ghi chú gắn chặt id hoặc đường dẫn task; ưu tiên residualRisks và decision tường minh; có cách dọn draft rác hiện có mà vẫn giữ journal append-only.

## Non-goals

- Không sửa hay xoá dòng journal cũ
- Không nới learning-safety

## Relevant paths

- `src/core/journal/learning-notes.ts`
- `src/core/journal/learning-capture.ts`
- `test/unit/core/journal`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [ ] `ac-1` (pending): Ghi chú rác (quá ngắn, không dấu, chuỗi test, gắn id task) không còn được capture, có test với fixture nhiễu
- [ ] `ac-2` (pending): Có đường dọn draft rác hiện có bằng entry mới đánh dấu rejected, journal cũ không bị sửa
- [ ] `ac-3` (pending): learning-safety và nhãn untrusted giữ nguyên hành vi

## Required checks

- [ ] `check-capture` (focused): Test bộ lọc capture và dọn draft — chưa chạy / not yet run
- [ ] `check-gates` (focused): Contract tests — chưa chạy / not yet run
- [ ] `check-suite` (full): Toàn bộ bộ test của dự án — chưa chạy / not yet run

## Decisions

- **d-scope-b** — Member B chỉ chặn mục dưới 40 ký tự và chuỗi kiểm thử, không chặn theo không dấu, giảm ưu tiên mục gắn task cụ thể.
  - _Why:_ 24 mục không dấu vẫn có giá trị; chặn cứng sẽ mất bài học thật.

## Evidence

_None recorded yet._
