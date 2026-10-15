# Tích hợp bộ công cụ kiểm định chất lượng: link validation, skill contract lint và trigger evaluation harness

- **ID:** 20261015-140653-skill-validation-tooling
- **Mode:** lite
- **Epic:** 20261015-140650-harnix-craft-and-quality-adoption
- **Status:** completed/finishing
- **Created:** 2026-10-15 14:06:50 +07:00
- **Updated:** 2026-10-15 14:44:59 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Tích hợp test markdown links, lint ranh giới skill không quá 200 dòng, không chứa cruft và script đo trigger TF-IDF stdlib.

## Relevant paths

- `package.json`
- `scripts/eval-skill-triggers.py`
- `test/unit/spec/markdown-links.test.ts`
- `test/workflow/skill-sources.test.ts`

## Relevant specs

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`

## Acceptance criteria

- [x] `ac-1` (met): Xây dựng test test/unit/spec/markdown-links.test.ts kiểm tra toàn bộ markdown links trong dự án không bị hỏng.
- [x] `ac-2` (met): Bổ sung kiểm tra cấu trúc ranh giới body <= 200 dòng và cấm prompt cruft vào test/workflow/skill-sources.test.ts.
- [x] `ac-3` (met): Tạo script scripts/eval-skill-triggers.py đo độ phân biệt trigger bằng TF-IDF + Cosine stdlib và thêm script test:links, eval:triggers vào package.json.
- [x] `ac-4` (met): Phiên bản package được bump thành 2.6.0-dev.4 qua pnpm version:sync.

## Required checks

- [x] `check-1` (focused): Kiểm tra markdown links, skill contract lint và trigger evaluation — pass (2026-10-15 14:43:19 +07:00)
- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-15 14:44:36 +07:00)

## Evidence

- `check-1` — pass (2026-10-15 14:43:19 +07:00): pnpm vitest run test/unit/spec/markdown-links.test.ts test/workflow/skill-sources.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-15 14:44:36 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
