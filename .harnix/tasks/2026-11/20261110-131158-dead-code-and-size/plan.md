# Plan: Xóa dead code và tách file sát trần

## Execution Slices

- [x] [chk-focus] Slice 1 (ac-1): xóa `skills-extension.ts`, `verify-docs-sync.ts`, `packageVerifyKeys`, `createCheckFailureFinding`, dòng thừa trong `completion.ts` cùng test liên quan; gỡ `export` không có caller.
- [x] [chk-focus] Slice 2 (ac-2): `plan-edit.ts` rút `editReviewData` cho `setPaths`, `addDecision`, `addRisk`, `setTitle`, `setGoal`; test đặc trưng hiện có giữ nguyên.
- [x] [chk-focus] Slice 3 (ac-3): `behavior-snapshot.test.ts` và `architecture.test.ts` vẫn xanh, golden không đổi.
- [x] [chk-suite] Slice 4: format, lint, typecheck, toàn suite, `test:gates`; bump `2.32.0-dev.7` và CHANGELOG.

## Guardrails & Invariants

- Không đổi hành vi: thứ tự lỗi và thông điệp của các setter giữ nguyên.
- Không sinh lại `test/workflow/behavior-snapshot.golden.json`; không thêm miễn trừ.

## Verification Matrix

| Check | Chứng minh | Tiêu chí |
| --- | --- | --- |
| chk-focus | golden và kiến trúc | ac-1, ac-2, ac-3 |
| chk-gates | contract tests nhanh | ac-1, ac-3 |
| chk-suite | toàn suite | ac-1, ac-2, ac-3 |
