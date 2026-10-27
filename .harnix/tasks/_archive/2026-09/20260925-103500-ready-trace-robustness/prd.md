# Product Requirements Document: Core Robustness & Parser Flexibility

## Overview

Refactor `src/core/tasks/ready-trace.ts` và các module workflow lõi để tăng độ ổn định, tránh các lỗi parsing ngớ ngẩn (như ký tự gạch nối checklist) và cải thiện tính mô-đun của codebase. Bổ sung hỗ trợ `roadmapMembers` trong save envelope để khi tạo Epic Roadmap, CLI tự động tạo và lưu trữ đầy đủ tất cả member tasks của Epic ngay từ đầu.

## Acceptance Criteria

### AC `ac-all-tests-green`
Toàn bộ test suite (`pnpm test`), build, typecheck và lint đều pass sạch sẽ.

### AC `ac-parser-dash-flexibility`
Grammar parser `ready-trace.ts` chấp nhận cả dấu gạch ngang chuẩn (`-`), en-dash (`–`), và em-dash (`—`) trong checklist plan.md.

### AC `ac-parser-unit-tests`
Bổ sung unit test toàn diện cho `ready-trace.ts` kiểm tra các trường hợp checklist và heading có ký tự unicode, spaces khác nhau.

### AC `ac-roadmap-member-scaffolding`
Save envelope hỗ trợ trường `roadmapMembers?: TaskRecord[]` để khi khởi tạo Epic, CLI tự động validate và lưu trữ toàn bộ các member tasks phụ ở trạng thái planning với cùng epicId.

### AC `ac-workflow-module-split`
Bóc tách các helper logic validation/snapshot từ `src/commands/internal-workflow.ts` sang module chuyên trách `src/core/tasks/workflow-helpers.ts` hoặc tương đương, giữ cho file chính gọn gàng và dễ đọc.
