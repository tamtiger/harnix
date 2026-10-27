# Kế hoạch: resolver vị trí task và epic

## Execution Slices

- [x] [chk-resolver] Slice 1 (ac-1): test đỏ rồi xanh cho `task-location.ts` và `epic-location.ts` (bucket, phẳng, archive, thứ tự dò, ID không có tiền tố ngày, liệt kê).
- [x] [chk-resolver] Slice 2: chuyển `task-store`, `task-index`, `task-resume`, `task-audit` và các chỗ ghi/đọc task trong `src/core/workflow` sang resolver.
- [x] [chk-resolver] Slice 3: chuyển doctor, journal, context, `commands/resume`, `epic.ts` (resolve, list, collect, upsert, render) sang resolver.
- [x] [chk-resolver] Slice 4 (ac-3): ngoại lệ digest và `artifactPaths` giữ đường dẫn logic, test khớp ở mọi bố cục (ac-3).
- [x] [chk-arch] Slice 5 (ac-2): test kiến trúc cấm chuỗi `tasks/${...}` và `epics/${...}` ngoài resolver (ac-2).
- [x] [chk-gates] Slice 6 (ac-4): `pnpm run test:gates`, golden không đổi (ac-4).
- [x] [chk-suite] Slice 7: bump `2.23.0-dev.1` kèm changelog, `pnpm run test` đầy đủ.

## Guardrails & Invariants

- Không đổi nội dung file task hay epic; chỉ đổi nơi tìm và nơi tạo mới.
- Ghi vào task đã tồn tại luôn ở đúng nơi nó đang nằm.
- Mọi đường dẫn qua `resolveSafeProjectPath`.

## Verification Matrix

| Check | Chứng minh |
| --- | --- |
| chk-resolver | resolver đúng thứ tự dò, ghi bucket, đọc mọi bố cục |
| chk-arch | không còn chuỗi dựng đường dẫn ngoài resolver |
| chk-gates | hợp đồng CLI, docs, golden còn nguyên |
| chk-suite | toàn bộ suite xanh trên repo ở bố cục phẳng |
