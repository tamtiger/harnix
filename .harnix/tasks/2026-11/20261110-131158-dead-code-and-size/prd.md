# PRD: Xóa dead code và tách file sát trần

## Context & Problem Statement

Review phát hiện mã chết và bề mặt export rộng hơn nhu cầu: `src/commands/skills-extension.ts` không có caller trong `src`, `src/core/stack/verify-docs-sync.ts` chỉ test dùng và đọc `docs/` vốn không có trong gói phát hành, `packageVerifyKeys` không ai dùng, `createCheckFailureFinding` chỉ test dùng, `completion.ts` có một dòng điều kiện thừa, và nhiều `export` chỉ dùng trong chính file. Ngoài ra `plan-edit.ts` lặp cùng một khung đọc-sửa-lưu ở năm hàm review-data.

## Scope & Boundaries

- Trong phạm vi: xóa mã chết đã xác nhận cùng test của nó, gỡ `export` không cần, gom khung chung của `plan-edit.ts`.
- Ngoài phạm vi: `selectAction` (còn được nhiều test dùng làm helper nên giữ), tách `archive.ts`, gom `finish`/`cancel` thành `finalizeTerminalTask` (ghi residual risk), refactor registry platform, đổi hành vi công khai, sinh lại golden.

## Anchored Acceptance Criteria

- ac-1: xóa dead code đã xác nhận kèm test liên quan.
- ac-2: `plan-edit.ts` dùng một khung chung cho các setter review-data, giữ nguyên thứ tự lỗi.
- ac-3: golden không đổi, không mở rộng miễn trừ ESLint hay kiến trúc.

## Architectural & Safety Constraints

Tuân theo `AGENTS.md`: mọi file `src` không quá 300 dòng code và complexity không quá 20; không đổi thông điệp lỗi; test kiến trúc và golden giữ nguyên.
