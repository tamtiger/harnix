# Đồng bộ cờ lệnh workflow và tài liệu hướng dẫn

- **ID:** 20261016-210441-sync-workflow-flags-and-docs
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-16 21:04:41 +07:00
- **Updated:** 2026-10-16 21:10:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Đồng bộ cờ lệnh workflow vào activation rules, AGENTS.md và docs

## Relevant paths

- `AGENTS.md`
- `docs/HARNIX_PRD.md`
- `src/templates/harnix/activation.ts`

## Acceptance criteria

- [x] `ac-1` (met): Bổ sung --set-criterion, --run-checks, --set-baseline vào activation rules và danh sách --brief trong activation.ts
- [x] `ac-2` (met): Cập nhật danh sách cờ workflow và repo-map trong AGENTS.md và docs/HARNIX_PRD.md
- [x] `ac-3` (met): Toàn bộ test suites, instruction budget và contract gates pass sạch sẽ

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-16 21:09:49 +07:00)
- [x] `check-gates` (focused): check-gates — pass (2026-10-16 21:08:17 +07:00)

## Decisions

- **dec-sync-docs** — Đồng bộ cờ lệnh workflow và repo-map vào activation rules và PRD bảo đảm tính nhất quán giữa implementation và hướng dẫn agent.
  - _Why:_ Tránh drift giữa các tính năng CLI mới và các quy tắc always-loaded.

## Evidence

- `check-gates` — pass (2026-10-16 21:08:17 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-16 21:09:49 +07:00): pnpm test — exit 0
