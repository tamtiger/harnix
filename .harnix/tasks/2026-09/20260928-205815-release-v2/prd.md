# PRD - [17] Tinh gọn gate phát hành, rà nhất quán docs và phát hành 2.0.0

## Bối cảnh và Mục tiêu

Đây là task cuối cùng trong Epic đại tu toàn diện Harnix (`20260928-180123-harnix-overhaul`). Sau 16 task thành phần đã hoàn tất (từ dọn code chết, đổi schema v3, chuẩn hóa giờ VN, thêm nền tảng OpenCode & Cursor, viết lại guides, thêm technique-skills đến test-impact map), task này có nhiệm vụ:
1. **Không còn danh sách miễn trừ (Zero exemptions):** Giải quyết các file `src/` còn vượt 300 dòng (`OVERSIZED_SOURCE_FILES`, `COMPLEX_SOURCE_FILES`) để danh sách miễn trừ trong `eslint.config.mjs` hoàn toàn trống, đáp ứng chỉ tiêu kiến trúc ≤ 300 dòng cho toàn bộ `src/`.
2. **Tinh gọn Acceptance Gates:** Bỏ việc chạy trùng lặp các test trong script `test:acceptance`, rà soát 17 script phát hành bảo đảm thời gian chạy tối ưu và không duplicate.
3. **Rà soát nhất quán tài liệu:** Rà soát lần cuối `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `README.md` bảo đảm phản ánh chính xác 100% hiện trạng sau đại tu, không còn tàn dư của các thành phần đã gỡ.
4. **Phát hành phiên bản 2.0.0:** Bump package version lên chính thức `2.0.0` qua `pnpm version:sync`, viết một entry duy nhất trong `CHANGELOG.md` tổng hợp toàn bộ Epic (liệt kê breaking changes và hướng dẫn migration).
5. **Đồng bộ Managed Output:** Tái sinh `.harnix/workflow.md` và `.harnix/.template-hashes.json` với `generatorVersion: 2.0.0`.
6. **Vượt qua Acceptance Sequence đầy đủ:** Chạy toàn bộ chuỗi kiểm thử section 11 (`format:check`, `lint`, `typecheck`, `test` với coverage sàn, `pack:check`, `smoke:tarball` trong fake home).

## Phạm vi (Scope)

### Trong phạm vi (In-Scope)
- Tách/tối ưu các file vượt 300 dòng trong `src/`:
  - `src/cli-program.ts`
  - `src/utils/file-lock.ts`
  - `src/catalog/catalog.ts`
  - `src/catalog/validation.ts`
  - `src/guides/catalog.ts`
  - Rà soát `src/core/context/context.ts` (giảm complexity).
  - Làm trống danh sách miễn trừ trong `eslint.config.mjs`.
- Rà soát các scripts phát hành trong `package.json` và `scripts/`:
  - Tối ưu `test:acceptance` để không chạy lại trùng các test files.
  - Rà soát `scripts/scan-release.mjs`, `scripts/version-sync.mjs`.
- Rà soát và cập nhật đồng bộ toàn bộ tài liệu dự án:
  - `docs/HARNIX_PRD.md`
  - `docs/HARNIX_WORKFLOW.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `README.md`
- Chạy `pnpm version:sync 2.0.0` và cập nhật `CHANGELOG.md` tổng hợp.
- Sinh lại managed output qua reconcile / template generator.
- Chạy nghiệm thu đầy đủ chuỗi Acceptance Sequence section 11.

### Ngoài phạm vi (Non-Goals)
- Không commit/push/PR tự động (tuân thủ nguyên tắc Harnix).
- Không chạm vào cấu hình thật của user home trên máy người dùng trong quá trình test.
- Không thêm tính năng mới nằm ngoài phạm vi Epic Overhaul.

## Tiêu chí chấp nhận (Acceptance Criteria)

- **`ac-no-exemptions`:** Danh sách miễn trừ `OVERSIZED_SOURCE_FILES` và `COMPLEX_SOURCE_FILES` trong `eslint.config.mjs` trống; mọi file trong `src/` ≤ 300 dòng; complexity ≤ 20.
- **`ac-gates`:** Acceptance sequence không chạy lại cùng test hai lần và tổng thời gian giảm so với hiện tại.
- **`ac-docs-consistency`:** PRD/WORKFLOW/IMPLEMENTATION_PLAN/README nhất quán với sản phẩm sau đại tu; không còn tham chiếu tới thành phần đã gỡ.
- **`ac-version-2`:** `package.json` và mọi nơi đồng bộ version là `2.0.0`; `CHANGELOG.md` có đúng một entry `2.0.0` tổng hợp liệt kê breaking change và hướng dẫn migrate.
- **`ac-managed-output`:** Sau khi bump 2.0.0, `.harnix/workflow.md` và `.harnix/.template-hashes.json` được sinh lại (`generatorVersion 2.0.0`) và self-host test pass.
- **`ac-acceptance`:** Acceptance sequence section 11 (gồm `format:check` và coverage floor) và fake-home tarball smoke pass với evidence mới.
