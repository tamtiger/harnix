# PRD: Refactor nguồn duy nhất cho action/flag, git dùng chung, bộ lọc learning dạng bảng

## Context & Problem Statement

Thêm một cờ hay action vào `harnix workflow` hiện phải sửa tay nhiều danh sách song song: `BOOLEAN_ACTIONS`/`VALUE_ACTIONS` và câu lỗi "requires exactly one of" (chép hai lần) trong `workflow-flags.ts`, `BRIEF_ACTIONS` trong `brief.ts`, các `hint` viết tay trong `workflow-flag-owners.ts`, và mô tả transport trong `schema.ts`. Quên một nơi chỉ lộ ra ở suite cuối. `findGitRoot` trong `src/utils/paths.ts` còn gọi `git` trần, không qua `safeGitArgs`. Bộ lọc `learning-safety` là chuỗi `if` khó mở rộng và khó test theo bảng.

## Scope & Boundaries

Trong phạm vi: bảng `WORKFLOW_ACTIONS` trong `src/core/workflow/actions.ts` làm nguồn cho danh sách action, câu lỗi chọn action, `BRIEF_ACTIONS` và hint của FLAG_OWNERS; test bảo đảm mỗi action có khai báo cờ và mô tả transport. Mọi lời gọi git trong `src` qua `src/utils/git.ts`. Bộ lọc learning thành bảng quy tắc. Ngoài phạm vi: đổi câu chữ hay hành vi public (golden và cli-contract giữ nguyên), sinh văn mô tả transport tự động (mô tả là văn viết tay, chỉ kiểm độ phủ).

## Anchored Acceptance Criteria

- ac-1: bảng ACTIONS duy nhất sinh danh sách action, câu lỗi, BRIEF_ACTIONS và hint; test bề mặt bắt thiếu khai báo.
- ac-2: mọi lời gọi git trong src đi qua module dùng chung.
- ac-3: golden và cli-contract không đổi.
- ac-4: learning-safety dạng bảng quy tắc, hành vi giữ nguyên.

## Architectural & Safety Constraints

Refactor thuần: không regenerate golden, không đổi output. Bảng đặt ở `src/core/workflow` vì `brief.ts` (core) dùng nó; `commands` đọc từ core theo đúng hướng phụ thuộc. Tuân thủ AGENTS.md và .harnix/spec/guides/.
