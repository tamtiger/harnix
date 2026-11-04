# Doctor không báo journal của task đã archive là mồ côi

- **ID:** 20261030-140445-doctor-archived-journal-links
- **Mode:** lite
- **Status:** planning/planning
- **Created:** 2026-10-30 14:04:45 +07:00
- **Updated:** 2026-10-30 14:04:47 +07:00

**Verdict:** PENDING — 0/1 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/1 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Journal tham chiếu task hoặc evidence của task nằm trong _archive không còn bị doctor báo journal-task-unlinked hoặc journal-evidence-unlinked; chỉ task thật sự không tồn tại ở live lẫn archive mới bị báo.

## Acceptance criteria

- [ ] `ac-1` (pending): inspectJournalRecords của doctor tra task trong cả live lẫn _archive (đọc chỉ đọc): journal của task đã archive không sinh journal-task-unlinked hay journal-evidence-unlinked, còn task không có ở đâu cả vẫn bị báo; test cho cả ba trường hợp và fixture mã hiện có vẫn pass.

## Required checks

- [ ] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-doctor` (focused): Test doctor và fixture mã finding — chưa chạy / not yet run

## Decisions

- **source** — Phát hiện khi chạy doctor sau epic workflow-ergonomics: 73 journal-task-unlinked và 6 journal-evidence-unlinked, id trỏ tới task trong .harnix/tasks/_archive.
  - _Why:_ Archive là bước thủ công hợp lệ nên doctor không được coi nó là dữ liệu mất.

## Evidence

_None recorded yet._
