# Giảm chi phí context mỗi lượt: bỏ Status khỏi băm, learningMax, gom note gần trùng

- **ID:** 20261124-232022-context-cost
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** planning/planning
- **Created:** 2026-11-24 23:20:22 +07:00
- **Updated:** 2026-11-24 23:21:03 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/4 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Giảm chi phí context mỗi lượt: không chèn lại khối hook chỉ vì đổi trạng thái, cho đặt giới hạn ghi chú học và gom note gần trùng.

## Acceptance criteria

- [ ] `ac-1` (pending): Phần băm quyết định ẩn khối hook không còn gồm dòng `Status: x/y`: hai lượt cùng session chỉ khác Status thì lượt sau in rỗng; đổi id, title, goal hoặc learning thì vẫn in lại.
- [ ] `ac-2` (pending): `.harnix/config.yaml` nhận `context.learningMax` (0 đến 5, mặc định 5; `0` tắt note chưa duyệt); validator, schema và doctor chấp nhận; config cũ không đổi hành vi.
- [ ] `ac-3` (pending): Khi chọn note cho ngữ cảnh, bỏ note có độ giống token (Jaccard từ 0,6) với note đã chọn; fixture hai note gần trùng chỉ cho vào một; hook protocol và redaction không đổi.
- [ ] `ac-4` (pending): Tài liệu, CHANGELOG, golden và schema config, phiên bản `2.40.0-dev.4` đồng bộ; kiểm bằng CLI thật qua `scripts/exercise-context-cost.mjs` (stdin hook event hai lượt trong dự án tạm có task và note học).

## Required checks

- [ ] `check-suite` (full): Toàn bộ test của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — chưa chạy / not yet run

## Evidence

_None recorded yet._
