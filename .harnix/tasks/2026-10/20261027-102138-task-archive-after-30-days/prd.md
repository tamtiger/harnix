# PRD: lệnh archive task và epic sau 30 ngày

## Context & Problem Statement

Task và epic đã kết thúc vẫn nằm cùng phần sống nên mọi lần quét đều tốn công. Cần một lệnh thủ công chuyển chúng sang kho `_archive` chỉ đọc, và khôi phục khi cần. Đặc tả: `.harnix/epics/20261027-102134-task-layout-bucket-archive/spec.md` (quyết định 5, 6, 7, 8). Không tự động chạy trong `init`, `update` hay `finish`.

## Scope & Boundaries

- Lệnh công khai `harnix archive [--days <n>] [--apply] [--restore <id>]`: mặc định dry-run, mốc tính là `completedAt` hoặc `cancelledAt` (thiếu thì `updatedAt`), chỉ task `completed` hoặc `cancelled`.
- Epic chỉ archive khi mọi thành viên đã kết thúc và quá hạn, cùng toàn bộ thành viên; thành viên của epic chưa hoàn tất không bao giờ đi riêng; task cha của follow-up chưa kết thúc và task đang active ở lại.
- `--restore <id>` đưa task hoặc cả cụm epic về bucket tháng.
- Kho chỉ đọc: ghi workflow vào task hoặc epic đã archive bị từ chối kèm hint `harnix archive --restore <id>`.
- Đóng epic: tài liệu, skill, template, CHANGELOG, `pnpm selfhost:sync`, bump `2.23.0` với `--fold-dev`, `measure:footprint`, `pnpm release:check`.
- Ngoài phạm vi: archive tự động.

## Anchored Acceptance Criteria

Bốn tiêu chí ac-1..ac-4 trong `task.json`.

## Architectural & Safety Constraints

Theo `AGENTS.md` và `.harnix/spec/guides/`: dependency một chiều, đường dẫn qua resolver, rename từng thư mục dưới khóa workflow, không ghi đè đích, không sửa nội dung file, mỗi file nguồn không quá 300 dòng code, không nâng `maxBytes` của footprint để cho qua.
