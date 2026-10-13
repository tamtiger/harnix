# Đóng epic learning: tài liệu gốc, kiểm chứng end-to-end và phát hành

- **ID:** 20261013-095416-learning-overhaul-close
- **Mode:** lite
- **Epic:** 20261013-095411-harnix-learning-overhaul
- **Status:** completed/finishing
- **Created:** 2026-10-13 09:54:11 +07:00
- **Updated:** 2026-10-13 14:14:58 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Cập nhật docs/HARNIX_WORKFLOW.md, PRD, workflow template (pnpm selfhost:sync), kiểm chứng end-to-end trên journal thật và phát hành X.(Y+1).0 bằng pnpm version:sync --fold-dev.

## Non-goals

- Không thêm tính năng mới

## Relevant paths

- `docs/HARNIX_WORKFLOW.md`
- `docs/HARNIX_PRD.md`
- `CHANGELOG.md`
- `src/templates/harnix/workflow.md`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [x] `ac-1` (met): Tài liệu và template mô tả đúng vòng đời learning mới, selfhost:sync đồng bộ
- [x] `ac-2` (met): Phát hành minor bằng version:sync --fold-dev, CHANGELOG gộp một mục
- [x] `ac-3` (met): Mọi gate (test, lint, typecheck, test:gates) có exit code 0 mới

## Required checks

- [x] `check-gates` (focused): Contract tests — pass (2026-10-13 14:12:58 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-10-13 14:14:26 +07:00)

## Evidence

- `check-gates` — pass (2026-10-13 14:12:58 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-13 14:14:26 +07:00): pnpm test — exit 0
