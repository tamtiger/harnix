# Chạy check bớt ma sát: run-check không nhắc lệnh, log lỗi đầy đủ, batch finish có run-checks

- **ID:** 20261124-232019-run-check-ergonomics
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** planning/planning
- **Created:** 2026-11-24 23:20:19 +07:00
- **Updated:** 2026-11-24 23:21:27 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/4 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Bỏ ma sát khi chạy check: --run-check lấy lệnh từ khai báo, log lỗi đầy đủ đọc lại được, và chuỗi hoàn tất task chạy được trong một lệnh batch.

## Acceptance criteria

- [ ] `ac-1` (pending): `harnix workflow --run-check <id>` không có `--` chạy đúng lệnh và cwd đã khai báo của check (không qua shell, cùng đường thực thi với `--run-checks`); argv truyền vào mà khác khai báo vẫn bị từ chối kèm hint.
- [ ] `ac-2` (pending): Khi một check fail, output tới trần 64 KB được ghi vào `.harnix/tmp/check-logs/<id>.log` (git-ignored, che đường dẫn tuyệt đối, mã ANSI và chuỗi giống secret, nằm ngoài input digest) và kết quả CLI có `logPath`; lần pass không ghi log; không thêm trường nào vào evidence hay TaskRecord.
- [ ] `ac-3` (pending): `--run-checks` được phép đứng cùng `--criterion --met --transition verifying/finishing --finish` theo thứ tự cố định và dừng ở lần fail đầu (task giữ `verifying`, báo `ran` và `remaining`); task chưa ở `in_progress` hoặc `verifying` bị từ chối kèm hint; `status --explain` `nextAction` kèm lệnh batch gợi ý. Không gộp `ready/ready`, bước ủy quyền triển khai hay review.
- [ ] `ac-4` (pending): `WORKFLOW_ACTIONS`, `--schema`, workflow-flag-owners, golden (chỉ chuỗi mới), docs (HARNIX_WORKFLOW, PRD), CHANGELOG và phiên bản `2.40.0-dev.1` đồng bộ; template `workflow.md` chỉ đổi dòng cookbook sẵn có (không tăng quá mức, ngân sách còn dư khoảng 200 token cho cả epic); kiểm bằng CLI thật qua `scripts/exercise-run-check.mjs` trong dự án tạm (không nhắc lệnh, check fail để lại log, batch finish).

## Required checks

- [ ] `check-suite` (full): Toàn bộ test của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — chưa chạy / not yet run

## Decisions

- **dec-scope-dropped** — Không làm: hook Edit/Write chặn hoặc cảnh báo sửa code (chỉ phủ Claude, thêm đọc task.json mỗi lần Edit, ranh giới hook không giữ state mờ); action --complete mới (chỉ mở rộng batch sẵn có, giữ ready/await, ủy quyền triển khai và review); lưu digest lúc vào planning (đổi schema TaskRecord đóng băng); bộ đếm mức dùng skill trong harnix (không telemetry, làm lệnh đọc thành ghi); member epic dạng Full.
  - _Why:_ Đối chiếu 3 báo cáo review với mã và AGENTS.md; xem research.md của epic.
- **dec-log-fail-only** — Log lỗi chỉ ghi khi check fail, ghi đè mỗi lần, tối đa 64 KB, ở .harnix/tmp/check-logs (git-ignored), đã che đường dẫn, ANSI và chuỗi giống secret. Đây là lần đầu harnix lưu output lệnh ra đĩa, đảo quyết định ghi ở run-check.ts (never persisted); cần người dùng xác nhận khi duyệt epic.
  - _Why:_ Cần xác nhận của người dùng; phương án nhẹ hơn là nới đuôi tóm tắt 600 lên khoảng 2000 ký tự và bỏ log.
- **dec-workflow-md-budget** — Template workflow.md còn dư khoảng 200 token cho cả epic: chỉ member 1 (sửa dòng cookbook sẵn có, không tăng) và member 6 (một dòng cho --scaffold-docs) được chạm; các member khác viết vào docs/HARNIX_WORKFLOW.md, PRD hoặc reference, không nâng token-budgets.json.
  - _Why:_ Trần token chỉ chặn tăng; không nâng để một thay đổi qua test.

## Evidence

_None recorded yet._
