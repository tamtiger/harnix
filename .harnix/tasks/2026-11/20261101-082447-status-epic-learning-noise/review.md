# Giảm nhiễu status/resume theo epic cũ và learning draft

- **ID:** 20261101-082447-status-epic-learning-noise
- **Mode:** lite
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** planning/planning
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 08:24:43 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/3 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Đóng D2/H10/H11/D4: `status` và `resume --next` quét epic cũ nhất, epic hỏng làm dừng im lặng, thứ tự epic theo ID, draft learning chỉ mô tả code.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/commands/status.ts`
- `src/commands/resume.ts`
- `src/commands/epic.ts`
- `src/core/journal/learning-quality.ts`

## Acceptance criteria

- [ ] `ac-1` (pending): `status` và `resume --next` bỏ qua epic hỏng hoặc đã archive, báo epic hỏng một dòng và không ném lỗi.
- [ ] `ac-2` (pending): `harnix epic` sắp theo mốc thời gian hợp lệ và không giấu epic không đọc được.
- [ ] `ac-3` (pending): Learning loại draft chỉ mô tả code hoặc có lệnh ẩn draft khỏi danh sách mặc định, có test.

## Required checks

- [ ] `chk-focused` (focused): Cổng hợp đồng và test tập trung — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
