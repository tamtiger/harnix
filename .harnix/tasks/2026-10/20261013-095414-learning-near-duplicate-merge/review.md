# Gộp gần trùng learning để draft hội tụ thành candidate

- **ID:** 20261013-095414-learning-near-duplicate-merge
- **Mode:** full
- **Epic:** 20261013-095411-harnix-learning-overhaul
- **Status:** completed/finishing
- **Created:** 2026-10-13 09:54:11 +07:00
- **Updated:** 2026-10-13 14:08:09 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | r-fold-collision: low |

## Goal

Thay băm exact của observationCandidateId bằng so khớp gần trùng deterministic, offline (chuẩn hoá dấu tiếng Việt, token/shingle), giữ ID ổn định và tương thích ngược với entry cũ; đánh giá lại ngưỡng candidate theo dữ liệu nghiên cứu.

## Non-goals

- Không thêm dependency
- Không đổi schema entry journal v1

## Relevant paths

- `src/commands/learning.ts`
- `src/core/journal/learning-capture.ts`
- `src/core/journal/learning-similarity.ts`
- `src/core/journal/learning.ts`
- `test/unit/core/journal`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Hai ghi chú cùng ý chỉ khác dấu tiếng Việt, hoa thường hoặc dấu câu được capture vào cùng một candidate (giữ id đã có), có test trên fixture tiếng Việt
- [x] `ac-2` (met): Entry cũ vẫn đọc được và id của candidate hiện có không đổi; id mới vẫn tính bằng cùng công thức băm
- [x] `ac-3` (met): harnix learning và harnix learning --promote trả danh sách similar (id gần trùng, Jaccard từ 0,5 trên token đã bỏ dấu), có test precision/recall trên fixture tiếng Việt
- [x] `ac-4` (met): Báo cáo số liệu trước và sau trên journal thật của repo này: số cặp gộp được nhờ gấp dấu và số cặp gợi ý trùng; kết quả ghi vào evidence

## Required checks

- [x] `check-merge` (focused): Test gộp gần trùng — pass (2026-10-13 14:06:07 +07:00)
- [x] `check-gates` (focused): Contract tests — pass (2026-10-13 14:06:12 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-10-13 14:07:40 +07:00)

## Decisions

- **d-scope-c** — Member C thu hẹp: gấp dấu vào khoá chuẩn hoá và gợi ý trùng khi review; bỏ mục tiêu tăng số candidate vì dữ liệu thật không có nhiều cặp gần trùng.
  - _Why:_ Jaccard 0,5 chỉ tìm 1 cặp trong 130 mục.
- **d-id-stable** — Giữ nguyên công thức id (băm chuỗi chuẩn hoá hiện tại); gộp biến thể khác dấu bằng khoá gấp dấu tra cứu qua statement của candidate đã có, không đổi id.
  - _Why:_ Đổi công thức băm sẽ đổi id của mọi candidate đã có và phá tương thích.
- **d-threshold** — Giữ ngưỡng candidate hiện tại (2 task nguồn, 2 evidence, confidence từ 0,8).
  - _Why:_ Nghiên cứu cho thấy vấn đề là thiếu đường duyệt, không phải ngưỡng; chỉ có 1 cặp gần trùng trong 130 mục.
- **d-measure** — Đo trên journal thật (139 entry): gấp dấu gộp thêm 0 candidate, 1 cặp live gần trùng (Jaccard từ 0,5), khớp kết quả nghiên cứu: dữ liệu hiện tại gần như không có biến thể khác dấu nên lợi ích là phòng ngừa cho các lần capture sau.
  - _Why:_ Số liệu trước và sau cho ac-4; không có cặp nào bị đổi id.

## Residual risks

- **r-fold-collision** (low) — Khoá bỏ dấu có thể gộp hai câu khác nghĩa chỉ khác dấu; candidate giữ statement đầu tiên nên không mất nội dung nhưng người duyệt nên xem similar

## Evidence

- `check-merge` — pass (2026-10-13 14:06:07 +07:00): pnpm exec vitest run test/unit/core/journal test/integration/commands/learning.test.ts — exit 0
- `check-gates` — pass (2026-10-13 14:06:12 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-13 14:07:40 +07:00): pnpm test — exit 0
