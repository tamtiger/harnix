# Nâng cấp tìm kiếm ký ức BM25 và tự động nháp Learning sau Bugfix

- **ID:** 20261016-113501-bm25-smart-memory-and-autodraft
- **Mode:** lite
- **Epic:** 20261016-113456-harnix-dx-and-microservices-enhancement
- **Status:** completed/finishing
- **Created:** 2026-10-16 11:34:56 +07:00
- **Updated:** 2026-10-16 14:45:54 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 1/1 passed |

## Goal

Thay thế so khớp thô sơ trong harnix mem bằng BM25 ranking không dependency, tự động nháp learning sau khi finish bugfix task và đóng Epic phát hành v2.8.0.

## Relevant paths

- `src/core/learning/**`
- `src/core/workflow/finish.ts`
- `test/**`

## Acceptance criteria

- [x] `ac-1` (met): harnix mem sử dụng thuật toán xếp hạng BM25 cho kết quả ngữ nghĩa cao và tự động tạo bản nháp learning khi hoàn thành task bugfix.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite của dự án phải xanh — pass (2026-10-16 14:45:38 +07:00)

## Evidence

- `check-suite` — pass (2026-10-16 14:45:38 +07:00): pnpm test — exit 0
