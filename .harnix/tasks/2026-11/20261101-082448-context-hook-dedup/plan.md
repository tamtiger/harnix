# Kế hoạch: hook context dedup theo session

## Execution Slices

1. Slice 1: helper `safeSlice` (src/utils/safe-slice.ts) cắt theo code unit nhưng lùi một đơn vị khi biên rơi giữa cặp surrogate; dùng trong `boundedContext` cho `contentBudget` và disclosure (ac-3).
2. Slice 2: `src/core/context/session-cache.ts` với slot theo session, ghi atomic, giới hạn 16 slot và dọn slot cũ nhất; nối vào `renderInternalContextForHook` (ac-1, ac-2).
3. Slice 3: test đỏ trước rồi xanh: `test/unit/utils/safe-slice.test.ts`, `test/unit/core/context/session-cache.test.ts`, mở rộng `test/workflow/internal-context-hooks.test.ts` (A, B, A, B, không sessionId, hash đổi) và `test/workflow/internal-context-boundary.test.ts` (emoji ở biên, nhánh lead).
4. Slice 4: bump version `2.24.0-dev.5` bằng `pnpm version:sync`, đồng bộ tài liệu bị ảnh hưởng, `pnpm format`.

- [x] [chk-focused] Slice 1-3: test tập trung của hook context xanh (ac-1, ac-2, ac-3)
- [x] [chk-gates] Slice 3-4: `pnpm run test:gates` xanh (ac-4)
- [x] [chk-suite] Slice 4: toàn bộ `pnpm run test` xanh (ac-3)

## Guardrails & Invariants

- Không đổi hook protocol đóng băng; `emptyPayload` theo từng platform giữ nguyên.
- Không có `sessionId` thì không chạm hệ thống tệp của cache.
- Slot lỗi hay hỏng được coi là cache miss, không làm hook thất bại.
- Không commit, branch, push hay publish.

## Verification Matrix

| Tiêu chí | Check | Cách kiểm chứng |
| --- | --- | --- |
| ac-1 | chk-focused | test xen kẽ A, B, A, B, giới hạn slot |
| ac-2 | chk-focused | test không sessionId, hash đổi |
| ac-3 | chk-focused, chk-suite | test emoji ở biên cắt, nhánh lead |
| ac-4 | chk-gates | `pnpm run test:gates` |
