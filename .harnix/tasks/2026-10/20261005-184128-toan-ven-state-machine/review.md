# Toàn vẹn state machine và dữ liệu task

- **ID:** 20261005-184128-toan-ven-state-machine
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 18:41:25 +07:00
- **Updated:** 2026-10-05 23:00:26 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Khóa các đường vượt freeze và mất dữ liệu: epicMembers ghi đè, blocked/resumeStatus, waive sau ready, thoát replan, dry-run lệch, migration, replace-check, batch, ghi epic không atomic (R-004, R-007, R-008, R-023 đến R-028, R-036).

## Non-goals

- Không đổi tên trạng thái hay checkpoint
- Không đọc lại hay ghi lại dữ liệu legacy

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): `epicMembers` chỉ tạo member chưa tồn tại; member đã tồn tại chỉ chấp nhận replay giống hệt, khác thì bị từ chối trước khi ghi bất kỳ file nào; member mới được ghi trước task chính và bị gỡ nếu lần save thất bại trước khi task commit; task có evidence không bao giờ bị ghi đè.
- `ac-2` (met): Vào `blocked` bắt buộc `blocker.resumeStatus` bằng status ngay trước; `--transition` resume được task `blocked` về đúng `resumeStatus` (bỏ `blocker`) mà không cần `--save` thô, và resume sai đích bị từ chối.
- `ac-3` (met): Sau first ready, chuyển criterion sang hoặc khỏi `waived`, hoặc đổi `waiverReason`, bắt buộc qua `replan` + `contractRevision.reason`; `--criterion --met` (pending sang met) không bị ảnh hưởng; trong replan, criterion đã được chứng minh không đổi `status`.
- `ac-4` (met): Từ checkpoint `replan` chỉ thoát được về `ready/ready` (hoặc `planning/planning` khi status là `planning`); `--transition ... --dry-run` dùng cùng hàm `collectReadyIssues` với transition thật nên `valid` đúng khi transition thật được chấp nhận, còn input glob không khớp file và baseline chỉ là `advisories` không làm `valid` thành false.
- `ac-5` (met): Migration v2 sang v3 giữ nguyên `inputs` của required check (trừ `@task-contract`) và từ chối khi bị thu hẹp hoặc mở rộng; `--replace-check` kế thừa `command` của check bị thay (đã làm ở task trước) có test hồi quy.
- `ac-6` (met): `--batch` dùng lại logic `plan-edit`: severity mặc định `low`, id decision/risk trùng và text rỗng bị từ chối như các cờ, obligation sau planning đi qua `saveObligationEdit` với `reason` 10-1000 ký tự, phát hiện đã qua planning theo `status`; envelope đầy đủ được mô tả trong `workflow --schema`.
- `ac-7` (met): Ghi file epic `.json`/`.md` dùng `atomicWriteFile` và có newline cuối; sơ đồ trong `docs/HARNIX_WORKFLOW.md` khớp bảng `transitions` thực tế theo cặp status/checkpoint.
- `ac-8` (met): Cổng chất lượng xanh: `pnpm run typecheck`, `pnpm run lint` và `pnpm run test` (có coverage, không hạ ngưỡng) đều exit 0 trên cây mã cuối cùng của task.

## Required checks

- `check-state` (focused): Test workflow, task và epic — pass (2026-10-05 22:58:34 +07:00)
- `check-migration` (focused): Test migration và tài liệu state machine — pass (2026-10-05 22:58:38 +07:00)
- `check-typecheck` (full): pnpm run typecheck exit 0 — pass (2026-10-05 22:58:44 +07:00)
- `check-lint` (full): pnpm run lint (format:check + ESLint) exit 0 — pass (2026-10-05 22:59:09 +07:00)
- `check-suite` (full): pnpm run test (vitest + coverage) exit 0 — pass (2026-10-05 23:00:03 +07:00)

## Decisions

- **d-dry-run-advisories** — Dry-run của --transition trả thêm trường advisories; valid chỉ phản ánh điều kiện transition thật kiểm tra (collectReadyIssues), còn input glob không khớp file và check chưa baseline là advisories.
  - _Why:_ Trước đây dry-run báo lỗi baseline mà transition thật bỏ qua, và làm theo gợi ý đó (chạy check trong planning) đóng băng obligation sớm.
- **d-golden-regenerated-twice** — Golden snapshot được sinh lại thêm một lần trong task này; diff chỉ gồm chữ mô tả --batch trong workflow --schema và dấu xuống dòng cuối của file epic json.
  - _Why:_ Cả hai là thay đổi có chủ ý của task, đã xem diff trước khi giữ.
- **d-lock-release-race** — Bộ kiểm tra khóa file coi EPERM và EBUSY khi đọc token đang được giải phóng là khóa đang đổi và chờ thử lại, như ENOENT.
  - _Why:_ Trên Windows file đang chờ xóa trả EPERM; hai tiến trình tranh khóa workflow bị lỗi EPERM thay vì chờ, lộ ra khi finish và cancel được đưa vào cùng khóa với save.

## Residual risks

- **r-waive-needs-replan** (low) — Task Lite cũ dùng --save thường để waive criterion sau ready nay phải đi qua replan kèm reason; script hoặc thói quen cũ sẽ bị từ chối với gợi ý contractRevision.
- **r-dry-run-shape** (low) — Dry-run của --transition thêm trường advisories; skill và cookbook nhắc valid cần được cập nhật ở task đồng bộ tài liệu.
- **r-release-pending-masks-eperm** (low) — Coi EPERM khi đọc token khóa là chờ có thể che một lỗi quyền thật; khi đó người dùng thấy lỗi hết thời gian chờ khóa thay vì EPERM, vẫn bị giới hạn bởi timeout 30 giây.

## Evidence

- `check-state` — pass (2026-10-05 22:58:34 +07:00): pnpm vitest run test/unit/core test/unit/commands test/workflow test/migration — exit 0
- `check-migration` — pass (2026-10-05 22:58:38 +07:00): pnpm test:migration — exit 0
- `check-typecheck` — pass (2026-10-05 22:58:44 +07:00): pnpm typecheck — exit 0
- `check-lint` — pass (2026-10-05 22:59:09 +07:00): pnpm lint — exit 0
- `check-suite` — pass (2026-10-05 23:00:03 +07:00): pnpm test — exit 0
