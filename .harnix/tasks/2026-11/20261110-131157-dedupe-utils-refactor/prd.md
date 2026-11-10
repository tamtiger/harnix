# PRD: Gom helper trùng lặp trong utils và core

## Context & Problem Statement

Review phát hiện cùng một hàm được viết lại nhiều lần: kiểm tra "đường dẫn không tồn tại" (`isMissing`, `isMissingPathError`, `isEnoent`) có khoảng 20 bản trong `src/`; `isContainedPath` có 3 bản (`utils/paths.ts`, `core/platform/user-paths.ts`, `utils/safe-read.ts`) và đây là kiểm tra bảo mật cốt lõi; `renameWithRetry` có 2 bản trong `utils/atomic-write.ts` và `utils/rename-retry.ts`; `readBoundedText` lặp ở `core/stack/detection.ts` và `detection-engine.ts`; `readOptionalText` lặp ở `core/global/discovery.ts` và `core/managed/project-files.ts`; `compareCodeUnits` được viết lại. Sửa một bản mà bỏ sót bản khác tạo drift, nhất là ở kiểm tra bảo mật.

## Scope & Boundaries

- Trong phạm vi: refactor thuần, không đổi hành vi công khai; thêm `src/utils/errno.ts` và dùng lại các helper có sẵn trong `src/utils`.
- Ngoài phạm vi: đổi thông điệp lỗi, đổi thứ tự thao tác, sinh lại `behavior-snapshot.golden.json`, mở rộng danh sách miễn trừ của ESLint hay test kiến trúc.

## Anchored Acceptance Criteria

- ac-1: `isMissing`/`isEnoent` gom về một helper trong `src/utils`, mọi bản lặp được thay.
- ac-2: `isContainedPath`, `renameWithRetry`, `readBoundedText`, `readOptionalText`, `compareCodeUnits` mỗi cái chỉ còn một bản.
- ac-3: golden không đổi, kiến trúc không thêm miễn trừ, suite và `test:gates` xanh.

## Architectural & Safety Constraints

Tuân theo `AGENTS.md`: `core` không phụ thuộc Commander/Inquirer, `utils` chỉ chứa helper dùng chung, mọi import qua alias `src/...`, kiểm tra bảo mật đường dẫn giữ nguyên ngữ nghĩa.
