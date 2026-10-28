# Thêm test hàng rào học từ hve-core: lệnh bị từ chối không ghi gì, catalog finding doctor, nguồn lockfile

- **ID:** 20261027-171247-hve-core-test-gates
- **Mode:** lite
- **Status:** planning/planning
- **Created:** 2026-10-27 17:12:47 +07:00
- **Updated:** 2026-10-28 10:42:18 +07:00

**Verdict:** PENDING — 0/5 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/5 met or waived |
| Required checks | 0% | 0/3 passed |

## Goal

Thêm các test xác định (không cần mô hình) bắt hồi quy: lệnh ghi bị từ chối để nguyên cây .harnix, mỗi mã finding của doctor có test sinh ra nó cùng fixture sạch, lockfile không chứa nguồn lạ; kèm quy tắc doc cho finding mới và rubric duyệt SKILL.md.

## Acceptance criteria

- [ ] `ac-1` (pending): Một bảng test chứng minh mỗi lệnh harnix workflow ghi bị từ chối (transition sai, evidence ghi giờ tương lai, check bị circuit breaker, --save chứa mojibake, ghi vào task đã archive) để nguyên cây .harnix: băm toàn bộ cây trước và sau rồi so bằng nhau, kèm mã thoát và thông điệp lỗi.
- [ ] `ac-2` (pending): Mọi mã finding của harnix doctor nằm trong một catalog DOCTOR_FINDING_CODES (mã tĩnh và mã dựng theo nền tảng) chia thành các file src/core/doctor không quá 300 dòng; một test duyệt catalog khẳng định mỗi mã có ít nhất một fixture sinh ra nó, và một dự án sạch cho 0 finding.
- [ ] `ac-3` (pending): scripts/scan-release-assertions.mjs kiểm pnpm-lock.yaml và package.json: không có tarball, URL http, URL git hay thông tin đăng nhập, và registry chỉ là npmjs; test trong test/safety/release-scanner.test.ts cho từng trường hợp vi phạm lẫn trường hợp sạch.
- [ ] `ac-4` (pending): AGENTS.md hoặc test/README.md ghi hai quy tắc ngắn (finding doctor mới ra mức warning trước; checklist duyệt khi sửa SKILL.md), và test/workflow/docs-task-contract.test.ts khẳng định cả hai câu còn có mặt.
- [ ] `ac-5` (pending): Một lần bump patch bằng pnpm version:sync kèm mục CHANGELOG, vì catalog doctor và quét release là thay đổi mã nguồn và script phát hành.

## Required checks

- [ ] `check-1` (focused): Test tập trung cho bảng lệnh ghi bị từ chối, catalog doctor và quét lockfile — chưa chạy / not yet run
- [ ] `chk-gates` (focused): Test hợp đồng — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ suite — chưa chạy / not yet run

## Evidence

_None recorded yet._
