# Loại bỏ dual-write file phẳng và chuẩn hóa lưu trữ Epic thuần folder

- **ID:** 20261018-175359-epic-pure-folder-storage
- **Mode:** full
- **Epic:** 20261018-175353-dx-robustness-and-php-resilience
- **Status:** completed/finishing
- **Created:** 2026-10-18 17:53:59 +07:00
- **Updated:** 2026-10-18 21:09:00 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Loại bỏ việc ghi đúp file phẳng (.json và .md) trong src/core/epics/epic.ts, chỉ ghi ra folder .harnix/epics/<id>/epic.json|md nhưng vẫn duy trì fallback đọc cho legacy epics; cập nhật test kiểm thử tương ứng.

## Non-goals

- Không phá vỡ tính tương thích ngược khi đọc các epic legacy từ file phẳng hoặc roadmaps.

## Relevant paths

- `src/core/epics/epic.ts`
- `test/unit/core/epics/epic.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Hàm upsertEpic và renderEpicMarkdown trong src/core/epics/epic.ts chỉ ghi vào thư mục .harnix/epics/<id>/, không ghi ra file phẳng ở thư mục cha.
- [x] `ac-2` (met): Cơ chế đọc fallback trong resolveEpicFile và listEpicIds vẫn đọc được cả folder mới lẫn file phẳng legacy cũ.
- [x] `ac-3` (met): Toàn bộ unit test cho epics và toàn bộ test gates pass 100%.
- [x] `ac-4` (met): Cập nhật harnix-plan SKILL.md và scouting-isolation.md chuẩn hóa giao thức báo cáo kết quả subagent cho Epic Multi-Agent.

## Required checks

- [x] `check-epic-storage` (focused): Kiểm tra unit test cho epic thuần folder không dual-write và test gates tài liệu — pass (2026-10-18 21:08:25 +07:00)
- [x] `check-suite-v4` (full): Replacement for check-suite-v3 — pass (2026-10-18 21:07:42 +07:00)

## Evidence

- `check-epic-storage` — pass (2026-10-18 21:08:25 +07:00): pnpm test:unit test/unit/core/epics — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-18 21:04:07 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-18 21:05:06 +07:00): Task contract revised at persisted replan: Khắc phục đường dẫn file kiểm tra localized-time và internal-workflow-save theo cấu trúc pure folder storage
- skipped (2026-10-18 21:05:24 +07:00): Task contract revised at persisted replan: Cập nhật command check-suite-v4 thành pnpm run test theo đúng project test command
- `check-suite-v4` — pass (2026-10-18 21:07:42 +07:00): pnpm test — exit 0
