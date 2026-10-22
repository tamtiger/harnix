# Gia cố Test Suite Structure, Line Endings và Vitest Isolation

- **ID:** 20261022-170922-test-structure-line-endings-and-vitest-isolation
- **Mode:** lite
- **Epic:** 20261022-170701-workflow-ergonomics-and-codebase-hardening
- **Status:** planning/planning
- **Created:** 2026-10-22 17:09:22 +07:00
- **Updated:** 2026-10-22 17:09:22 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/3 met or waived |
| Required checks | 0% | 0/3 passed |

## Goal

Cải tiến logic đếm dòng trong test-structure.test.ts (đếm lines of code thực tế thay vì tính dòng trống/comment) hoặc trích xuất helpers sang test/support/, hạ nhiệt 19 file test sát trần 400 dòng; bổ sung .gitattributes và đồng bộ Prettier LF; cố định pool: 'forks' trong vitest.config.ts và bổ sung describe.sequential cho các test dùng process.chdir().

## Acceptance criteria

- [ ] `ac-1` (pending): Cải tiến logic đo độ dài file test trong test-structure.test.ts để đếm số dòng code thực tế (bỏ qua dòng trống và comments tương tự như architecture.test.ts), giúp ngăn chặn vỡ test khi chạy prettier và hạ nhiệt 19 file test đang sát trần 400 dòng.
- [ ] `ac-2` (pending): Bổ sung file .gitattributes chuẩn hóa eol=lf cho mã nguồn và text scripts; cấu hình Prettier endOfLine='lf' để chấm dứt tình trạng lệch dòng CRLF trên Windows.
- [ ] `ac-3` (pending): Cố định tường minh pool: 'forks' trong vitest.config.ts và bổ sung describe.sequential cho 7 integration test files có gọi process.chdir() để triệt tiêu hoàn toàn race condition khi test chạy song song.

## Required checks

- [ ] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run
- [ ] `check-test-structure` (focused): check-test-structure — chưa chạy / not yet run
- [ ] `check-gitattributes` (focused): check-gitattributes — chưa chạy / not yet run

## Evidence

_None recorded yet._
