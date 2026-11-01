# PRD: Siết setup global và an toàn symlink

## Context & Problem Statement

Review phiên trước tìm thấy các lỗi ở lớp setup global và đọc/ghi file:

- `src/core/global/setup.ts`: khi thiếu launcher `harnix` trên PATH, `LAUNCHER_WARNING` được thêm và `setupNotice` của nền tảng (trust Codex, precedence Antigravity, shadow CLAUDE.md OpenCode) bị nuốt.
- `src/utils/atomic-write.ts`: ghi temp rồi rename lên đích; nếu đích là symlink (ví dụ dotfile quản lý bằng symlink) thì symlink bị thay bằng file thường.
- `src/core/spec/project-skills.ts` và `readSafeText` trong `src/core/stack/workspace-detection.ts`, `src/core/stack/verify-detection.ts` theo symlink thoát khỏi root dự án rồi đọc nội dung ngoài root.

## Scope & Boundaries

Trong phạm vi: ac-1 (notice luôn hiển thị), ac-3 (atomic write giữ symlink nội bộ), ac-5 (skill dự án không theo symlink ra ngoài), ac-6 (stack detection không đọc manifest symlink ra ngoài).

Ngoài phạm vi, đã bỏ có ghi decision: hooks.json Codex không có bản ghi sidecar (residual risk, vì không suy ra quyền sở hữu từ nội dung), mã `test-*-required` khi `VITEST` (không có bằng chứng bug), tiêu chí chung "mọi test dùng home dùng một lần".

## Anchored Acceptance Criteria

Các tiêu chí ac-1, ac-3, ac-5, ac-6 nằm trong `task.json`; mỗi tiêu chí có test đỏ trước, kiểm bằng `chk-focused`, toàn bộ bằng `chk-suite`.

## Architectural & Safety Constraints

Tuân theo `AGENTS.md` và `.harnix/spec/guides/`: fixture symlink chỉ trong thư mục tạm của test, home dùng một lần được inject, không chạm home thật, không tạo `~/.harnix`; đường dẫn không lộ ra output; import theo alias `src/...`; mỗi file dưới 300 dòng code.
