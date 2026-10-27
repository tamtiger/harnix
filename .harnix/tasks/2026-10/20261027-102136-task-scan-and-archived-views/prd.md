# PRD: quét task và epic theo phần sống, kho lưu trữ và đo tốc độ

## Context & Problem Statement

Sau resolver (task `task-location-resolver`) task và epic nằm ở bucket tháng, bố cục phẳng hoặc `_archive`. `harnix tasks` tải tuần tự mọi task (0,8 giây với 252 task) và `harnix epic` quét lại toàn bộ task cho từng epic (2,9 giây). Đặc tả: `.harnix/epics/20261027-102134-task-layout-bucket-archive/spec.md` (quyết định 8, 9, 10).

## Scope & Boundaries

- `listTaskIds` nhận giới hạn tháng; `createTaskIndex` nhận `archived` và tải task song song có giới hạn.
- `collectEpicMembers` quét cả bucket lẫn `_archive` nhưng chỉ từ tháng của epic trở đi; danh sách epic gom thành viên một lượt.
- Cờ `--archived` cho `harnix tasks` và `harnix epic` (danh sách).
- doctor, status, resume, baseline-hint, restore-artifacts, learning-sources, `--follow-up` đã đi qua resolver ở task trước; task này thêm test cho bố cục bucket và `_archive` và đảm bảo không coi thư mục tháng hay `_archive` là task lỗi.
- Ngoài phạm vi: migration và lệnh archive (hai task sau).

## Anchored Acceptance Criteria

Bốn tiêu chí ac-1..ac-4 trong `task.json`.

## Architectural & Safety Constraints

Theo `AGENTS.md` và `.harnix/spec/guides/`: dependency một chiều, đường dẫn qua resolver, file nguồn không quá 300 dòng code, không regenerate golden ngoài khóa đường dẫn. Kho `_archive` chỉ đọc. Kết quả quét có giới hạn tháng phải bằng quét toàn bộ.
