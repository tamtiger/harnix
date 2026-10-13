# Gộp gần trùng learning để draft hội tụ thành candidate

- **ID:** 20261013-095414-learning-near-duplicate-merge
- **Mode:** full
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

Thay băm exact của observationCandidateId bằng so khớp gần trùng deterministic, offline (chuẩn hoá dấu tiếng Việt, token/shingle), giữ ID ổn định và tương thích ngược với entry cũ; đánh giá lại ngưỡng candidate theo dữ liệu nghiên cứu.

## Non-goals

- Không thêm dependency
- Không đổi schema entry journal v1

## Relevant paths

- `src/core/journal/learning.ts`
- `src/core/journal/learning-capture.ts`
- `src/core/journal/learning-store.ts`
- `test/unit/core/journal`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [ ] `ac-1` (pending): Hai ghi chú cùng ý khác câu chữ (kể cả khác dấu) được gộp vào một candidate, có test precision/recall trên fixture tiếng Việt
- [ ] `ac-2` (pending): Entry cũ vẫn đọc được và candidate hiện có không bị đổi id
- [ ] `ac-3` (pending): Báo cáo số liệu trước và sau trên bản sao journal thật: số candidate hội tụ tăng

## Required checks

- [ ] `check-merge` (focused): Test gộp gần trùng — chưa chạy / not yet run
- [ ] `check-gates` (focused): Contract tests — chưa chạy / not yet run
- [ ] `check-suite` (full): Toàn bộ bộ test của dự án — chưa chạy / not yet run

## Decisions

- **d-scope-c** — Member C thu hẹp: gấp dấu vào khoá chuẩn hoá và gợi ý trùng khi review; bỏ mục tiêu tăng số candidate vì dữ liệu thật không có nhiều cặp gần trùng.
  - _Why:_ Jaccard 0,5 chỉ tìm 1 cặp trong 130 mục.

## Evidence

_None recorded yet._
