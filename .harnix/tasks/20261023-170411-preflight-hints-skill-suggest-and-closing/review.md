# Contextual Technique Hints, lệnh skill --suggest, Actionable Error Messages, cảnh báo Stale Facts và đóng Epic

- **ID:** 20261023-170411-preflight-hints-skill-suggest-and-closing
- **Mode:** lite
- **Epic:** 20261023-170406-enterprise-events-brief-defaults-and-multi-workspace
- **Status:** planning/planning
- **Created:** 2026-10-23 17:04:11 +07:00
- **Updated:** 2026-10-23 17:08:03 +07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/5 met or waived |
| Required checks | 0% | 0/1 passed |

## Goal

Thêm suggestedTechniques vào workflow --preflight; bổ sung lệnh harnix skill --suggest; Actionable Error Suggestions; cảnh báo projectFactsStale: true; đồng bộ tài liệu, pnpm selfhost:sync và đóng Epic.

## Acceptance criteria

- [ ] `ac-1` (pending): workflow --preflight tự động phân tích ngữ cảnh và trả về suggestedTechniques?: string[] dựa trên triệu chứng thực tế.
- [ ] `ac-2` (pending): Bổ sung lệnh harnix skill --suggest <query> hỗ trợ tìm kiếm skill theo mô tả ngữ nghĩa.
- [ ] `ac-3` (pending): Actionable Error Suggestions cho lỗi schema validation và sai checkpoint/stage.
- [ ] `ac-4` (pending): Preflight phát hiện commit hash của HEAD thay đổi so với thời điểm trích xuất facts thì cảnh báo projectFactsStale: true.
- [ ] `ac-5` (pending): Đồng bộ tài liệu dự án, chạy pnpm selfhost:sync và bump minor package đóng Epic.

## Required checks

- [ ] `check-suite` (full): Toàn bộ test suite của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
