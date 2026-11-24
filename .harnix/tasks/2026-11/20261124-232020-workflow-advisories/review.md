# Advisory không chặn: sửa code trước in_progress, tiêu chí nháp cũ, thiếu Could-Not-Verify, dòng premortem

- **ID:** 20261124-232020-workflow-advisories
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** planning/planning
- **Created:** 2026-11-24 23:20:20 +07:00
- **Updated:** 2026-11-24 23:21:27 +07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/5 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Cảnh báo sớm nhưng không chặn: sửa code trước in_progress, tiêu chí nháp đã cũ, bằng chứng chỉ code-only mà chưa ghi rủi ro, và câu hỏi premortem ở ready-review.

## Acceptance criteria

- [ ] `ac-1` (pending): `--transition ready/ready --dry-run` và `--transition in_progress/implementing` thêm advisory khi `git status` thấy file đổi trong `relevantPaths` lúc task còn `planning` hoặc `ready`, nêu tên file (tối đa 5); không có git hoặc cây sạch thì im lặng; chỉ thông tin, không đổi `valid`, exit code hay TaskRecord.
- [ ] `ac-2` (pending): `ready --dry-run` thêm advisory cho task có `createdAt` đã quá N ngày hoặc đã có commit chạm `relevantPaths` kể từ `createdAt` (nêu số ngày và số commit), tính từ `git log` chỉ đọc; im lặng khi không có git hoặc `relevantPaths` rỗng; N chốt bằng decision.
- [ ] `ac-3` (pending): `--transition verifying/finishing` hoặc `--finish --brief` thêm advisory khi evidence tươi nhất của tiêu chí quan sát được có `mode: code-only` hoặc `partial` mà task chưa có residual risk; có risk thì im lặng; không chặn.
- [ ] `ac-4` (pending): `READY_REVIEW_CHECKLIST` có thêm một dòng premortem ngắn (điều gì sai nhất làm plan thất bại và check nào bắt nó); test ready-review và parity với reference ready-review cập nhật; không nâng trần token.
- [ ] `ac-5` (pending): Tài liệu (HARNIX_WORKFLOW, PRD), một dòng trong `harnix-implement` nhắc advisory, CHANGELOG và phiên bản `2.40.0-dev.2` đồng bộ; kiểm bằng CLI thật qua `scripts/exercise-advisories.mjs` trong repo git tạm (sửa file trước in_progress, member cũ, code-only không có risk).

## Required checks

- [ ] `check-suite` (full): Toàn bộ test của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — chưa chạy / not yet run

## Decisions

- **dec-advisory-vs-head** — Advisory sửa code trước in_progress so với git status trong relevantPaths, không lưu digest nên có thể dương tính giả khi repo đã bẩn từ trước và im lặng khi không có git; ngưỡng N ngày của advisory tiêu chí cũ do member chốt bằng decision (đề xuất 3 ngày hoặc có commit chạm relevantPaths).
  - _Why:_ Lưu digest cần thêm trường TaskRecord, vi phạm schema đóng băng.

## Evidence

_None recorded yet._
