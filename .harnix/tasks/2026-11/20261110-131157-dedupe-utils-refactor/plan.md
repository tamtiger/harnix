# Plan: Gom helper trùng lặp trong utils và core

## Execution Slices

- [x] [chk-focus] Slice 1 (ac-1): `src/utils/errno.ts` (`hasErrorCode`, `isMissingPathError`) có spec; codemod thay các bản `isMissing` và `isMissingPathError`; typecheck và test đặc trưng vẫn xanh.
- [x] [chk-focus] Slice 2 (ac-2): `isContainedPath` một bản trong `utils/paths.ts`; `renameWithRetry` một bản; `readBoundedText` và `readOptionalText` một bản; `compareCodeUnits` một bản.
- [x] [chk-focus] Slice 3 (ac-3): `behavior-snapshot.test.ts` và `architecture.test.ts` vẫn xanh, golden không đổi.
- [x] [chk-suite] Slice 4: format, lint, typecheck, toàn suite, `test:gates`; bump `2.32.0-dev.6` và CHANGELOG.

## Guardrails & Invariants

- Không đổi hành vi: mọi test hiện có là test đặc trưng, phải xanh trước và sau mỗi slice.
- Không sinh lại `test/workflow/behavior-snapshot.golden.json`.
- Không thêm miễn trừ vào `eslint.config.mjs` hay test kiến trúc.

## Verification Matrix

| Check | Chứng minh | Tiêu chí |
| --- | --- | --- |
| chk-focus | golden, kiến trúc và test của utils | ac-1, ac-2, ac-3 |
| chk-gates | contract tests nhanh | ac-3 |
| chk-suite | toàn suite | ac-1, ac-2, ac-3 |
