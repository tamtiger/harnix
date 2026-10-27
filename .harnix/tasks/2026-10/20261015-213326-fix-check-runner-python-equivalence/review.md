# Nhận diện tương đương lệnh kiểm thử Python và gợi ý runner trong check runner

- **ID:** 20261015-213326-fix-check-runner-python-equivalence
- **Mode:** full
- **Epic:** 20261015-213325-harnix-dx-workflow-friction-reduction
- **Status:** completed/finishing
- **Created:** 2026-10-15 21:33:25 +07:00
- **Updated:** 2026-10-15 23:18:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Mở rộng equivalentCommand để nhận diện pytest và python -m pytest (kể cả runner prefixes) là tương đương, hỗ trợ fallback và gợi ý runner khi gặp ENOENT.

## Relevant paths

- `src/core/stack/verify-detection.ts`
- `src/core/workflow/command-match.ts`
- `src/utils/check-runner.ts`
- `test/**`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): equivalentCommand và sameCommand nhận diện pytest tương đương với python -m pytest, python3 -m pytest, py -m pytest và các runner uv/poetry.
- [x] `ac-2` (met): detectPythonVerify và check runner đưa ra gợi ý rõ ràng hoặc giải quyết được khi pytest không nằm trong PATH.

## Required checks

- [x] `check-gates` (focused): Chạy kiểm thử gates nhanh cho thay đổi — pass (2026-10-15 23:16:23 +07:00)
- [x] `check-suite` (full): Chạy toàn bộ test suite của Harnix — pass (2026-10-15 23:17:42 +07:00)

## Evidence

- skipped (2026-10-15 21:33:25 +07:00): Task contract revised at persisted replan: Cập nhật lại văn bản tiếng Việt có dấu chuẩn mã hóa UTF-8 cho tiêu chí và mô tả của task.
- `check-gates` — pass (2026-10-15 23:16:23 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-15 23:17:42 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
