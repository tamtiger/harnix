# Hook context dedup bền theo session và an toàn khi chạy song song

- **ID:** 20261101-082448-context-hook-dedup
- **Mode:** full
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

Đóng D1/R2/R3/R11: một slot cache chung cho nhiều session, mất con trỏ sau compact, cắt giữa cặp surrogate.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/commands/internal-context.ts`

## Acceptance criteria

- [ ] `ac-1` (pending): Cache dedup khoá theo session nên hai session song song không ghi đè nhau.
- [ ] `ac-2` (pending): Sau compact hoặc khi host không gửi session id, payload vẫn được đưa lại hợp lý và có test cho từng nhánh.
- [ ] `ac-3` (pending): Cắt `contentBudget` không phá cặp surrogate hay cắt giữa lead; `pnpm test:gates` xanh.

## Required checks

- [ ] `chk-focused` (focused): Cổng hợp đồng và test tập trung — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
