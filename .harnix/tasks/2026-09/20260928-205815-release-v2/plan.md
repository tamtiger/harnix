# Kế hoạch - [17] Tinh gọn gate phát hành, rà nhất quán docs và phát hành 2.0.0

## Các lát cắt (Slices)

- [x] S1. Giải quyết các file oversized/complex và xóa bỏ toàn bộ danh sách miễn trừ trong ESLint:
  - Tách `src/catalog/catalog.ts` và `src/catalog/validation.ts` để mỗi file ≤ 300 dòng code.
  - Tách `src/guides/catalog.ts` thành descriptor data và resolver module (mỗi file ≤ 300 dòng).
  - Tách `src/cli-program.ts` thành module đăng ký command tách biệt (mỗi file ≤ 300 dòng).
  - Tách `src/utils/file-lock.ts` thành helper/retries và lock core (mỗi file ≤ 300 dòng).
  - Tối ưu `src/core/context/context.ts` để complexity ≤ 20.
  - Rà soát `scripts/scan-release.mjs` và `scripts/version-sync.mjs`.
  - Làm trống các mảng `OVERSIZED_SOURCE_FILES`, `COMPLEX_SOURCE_FILES`, `RELEASE_SCRIPT_EXEMPTIONS` trong `eslint.config.mjs`.
  - Chạy `pnpm lint` và `pnpm typecheck` xác nhận không còn bất kỳ vi phạm nào.
- [x] S2. Tinh gọn scripts phát hành và loại bỏ chạy trùng lặp trong `test:acceptance`:
  - Cập nhật script `test:acceptance` trong `package.json` để chạy một lượt tối ưu, không chạy trùng lặp các test files đã chạy.
  - Rà soát 17 scripts trong `scripts/` và `package.json`.
- [x] S3. Rà soát và đồng bộ nhất quán toàn bộ tài liệu dự án:
  - Rà soát lần cuối `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `README.md`.
  - Đảm bảo phản ánh chính xác 100% hiện trạng sản phẩm v2.0.0, không còn tàn dư của các thành phần đã gỡ.
- [x] S4. Bump version 2.0.0 và hợp nhất CHANGELOG:
  - Chạy `pnpm version:sync 2.0.0 --summary "Harnix 2.0.0 Overhaul Release" --kind changed`.
  - Hợp nhất toàn bộ các thay đổi của Epic vào một entry `## [2.0.0]` duy nhất trong `CHANGELOG.md`, nêu rõ breaking changes và hướng dẫn migration.
- [x] S5. Tái sinh Managed Output và đồng bộ template:
  - Cập nhật `.harnix/workflow.md` và `.harnix/.template-hashes.json` với `generatorVersion: 2.0.0`.
  - Chạy self-host và verify template matching tests.
- [x] S6. Thực thi chuỗi kiểm thử Acceptance Sequence section 11:
  - Chạy đầy đủ chuỗi lệnh: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test:acceptance`, `pnpm pack:check`, `pnpm smoke:tarball`, `pnpm measure:init`, `pnpm measure:footprint`, `pnpm scan:release`.
  - Ghi nhận evidence cho từng check và hoàn tất task.

## Kiểm chứng (Validation Checks)

- `check-no-exemptions`: `pnpm lint && pnpm vitest run test/workflow/architecture.test.ts`
- `check-gates`: `pnpm vitest run test/unit/test-structure.test.ts`
- `check-docs-consistency`: `pnpm vitest run test/workflow/skill-sources.test.ts test/workflow/cli-contract.test.ts`
- `check-version-2`: `pnpm vitest run test/unit/version.test.ts test/workflow/instruction-budget.test.ts`
- `check-managed-output`: `pnpm vitest run test/platform/global-adapters.test.ts test/unit/templates/harnix/global-surface.test.ts`
- `check-acceptance`: `pnpm pack:check && pnpm smoke:tarball && pnpm test`
