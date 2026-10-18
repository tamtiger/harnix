# Chuẩn hóa Two-Tier Verification và hướng dẫn tích hợp bền bỉ trong PHP Guide

- **ID:** 20261018-175356-defensive-architecture-two-tier-guide
- **Mode:** lite
- **Epic:** 20261018-175353-dx-robustness-and-php-resilience
- **Status:** completed/finishing
- **Created:** 2026-10-18 17:53:56 +07:00
- **Updated:** 2026-10-18 20:32:15 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Cập nhật gọn nhẹ src/guides/languages/php.md bổ sung quy chuẩn 2 tầng kiểm thử (unit mock + CLI dry-run/integration) và kiến trúc post-commit decoupling theo chuẩn hướng dẫn Harnix.

## Non-goals

- Không đưa kiến thức riêng của từng framework (như FastCGI cụ thể của dự án) vào guide chung của package.

## Relevant paths

- `src/guides/languages/php.md`

## Acceptance criteria

- [x] `ac-1` (met): Tài liệu guide PHP được bổ sung ngắn gọn về Two-tier verification và nguyên tắc post-commit dispatch.
- [x] `ac-2` (met): Kiểm tra test gates (docs, guide catalog, instruction budget) pass 100%.

## Required checks

- [x] `check-php-guide` (focused): Kiểm tra catalog guides và instruction budget sau khi cập nhật guide PHP — pass (2026-10-18 20:30:46 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-18 20:32:02 +07:00)

## Evidence

- `check-php-guide` — pass (2026-10-18 20:30:46 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-18 20:32:02 +07:00): pnpm test — exit 0
