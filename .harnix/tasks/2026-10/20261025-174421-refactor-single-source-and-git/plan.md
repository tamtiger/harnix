# Plan: Refactor nguồn duy nhất, git dùng chung, learning dạng bảng

## Execution Slices

- [x] [chk-actions] ac-1: thêm `src/core/workflow/actions.ts` (tên action, cờ, kiểu boolean/value, nhận --brief) theo đúng thứ tự câu lỗi hiện tại; `workflow-flags.ts` lấy danh sách và câu lỗi từ bảng; `brief.ts` lấy BRIEF_ACTIONS từ bảng; hint của FLAG_OWNERS sinh từ danh sách action của owner (giữ phần chú thích riêng); test bảo đảm mỗi action có option trong workflow-command và mục trong schema
- [x] [chk-git] ac-2: `findGitRoot` dùng `runGit`; test quét `src` không còn `execFile("git"` ngoài `src/utils/git.ts`
- [x] [chk-learning-table] ac-4: learning-safety thành bảng quy tắc (loại, cách đọc văn bản, mẫu)
- [x] [chk-actions] ac-3: golden và cli-contract chạy xanh không regenerate
- [x] [check-suite] lint, typecheck, toàn bộ test; `pnpm version:sync 2.22.0-dev.3`; cập nhật mục "Thêm cờ hoặc action workflow" trong AGENTS.md

## Guardrails & Invariants

- Không đổi bất kỳ chuỗi output nào; golden không regenerate.
- Hướng phụ thuộc: commands -> core -> utils.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1, ac-3 | chk-actions |
| ac-2 | chk-git |
| ac-4 | chk-learning-table |
| tất cả | check-suite |
