# Nghiên cứu lại tính năng learning: dữ liệu thật, kỹ thuật gộp gần trùng, mô hình áp dụng

- **ID:** 20261013-095412-learning-research
- **Mode:** lite
- **Epic:** 20261013-095411-harnix-learning-overhaul
- **Status:** completed/finishing
- **Created:** 2026-10-13 09:54:11 +07:00
- **Updated:** 2026-10-13 10:01:54 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Trả lời R1–R5 bằng bằng chứng: phân loại 130 learning hiện có, so sánh các harness khác, kỹ thuật gộp gần trùng offline, tiêu chí bài học tái sử dụng được và đường áp dụng an toàn; ghi research note làm đầu vào cho các member sau.

## Non-goals

- Không sửa mã nguồn
- Không thêm dependency hay gọi mạng ngoài việc tham khảo tài liệu

## Relevant paths

- `src/core/journal`
- `src/core/context`
- `src/commands/mem.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [x] `ac-1` (met): Có research note tiếng Việt trong research/ của task trả lời đủ R1–R5 kèm số liệu từ journal thật và khuyến nghị chọn phương án
- [x] `ac-2` (met): Mỗi member sau (B, C, A) ghi lại quyết định rút ra từ research bằng add-decision

## Required checks

- [x] `check-gates` (focused): Hợp đồng không bị phá khi task chỉ thêm tài liệu nghiên cứu — pass (2026-10-13 10:00:14 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-10-13 10:01:27 +07:00)

## Decisions

- **d-research-findings** — Dữ liệu thật cho thấy learning ít rác (khoảng 1–2%) và rất ít trùng gần (1 cặp ở Jaccard 0,5), nên vấn đề chính là thiếu bước duyệt/áp dụng và chọn theo độ mới thay vì theo độ liên quan.
  - _Why:_ Phân loại 130 mục journal và thử gộp theo token trong research note.

## Evidence

- `check-gates` — pass (2026-10-13 10:00:14 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-13 10:01:27 +07:00): pnpm test — exit 0
