# Kế hoạch — Đóng các đường xanh giả của check và evidence

## Checklist theo slice

- [x] Slice 1 (R-003): module `src/core/workflow/evidence-time.ts` + gọi trong `save.ts`; evidence mới có `recordedAt` > giờ hiện tại + 5 giây bị từ chối ở mọi transport.
- [x] Slice 2 (R-005): chuẩn hóa `cwd` (validator `task-validate.ts` dùng `normalizeRepositoryPath`; `run-check.ts` dùng `resolveSafeProjectPath` có realpath); `--run-check --cwd` phải bằng khai báo; `canonicalCheck` và `assertFrozenRequiredChecks` có `cwd`.
- [x] Slice 3 (R-002a): module `src/core/workflow/command-match.ts` (`normalizeCommand`, `sameCommand`); `run-check.ts` từ chối argv lệch `command`; summary ghi lệnh thật (cắt 200 ký tự).
- [x] Slice 4 (R-002b): `suite-gate.ts` yêu cầu `command` của suite check khớp lệnh test từ `buildVerifyPlan` ở cả ready và finishing; rà và sửa fixture.
- [x] Slice 5 (R-009): `withWorkflowLock` dùng chung; `finish.ts` và `cancel.ts` chạy trong lock và đọc lại task trong lock.
- [x] Slice 6 (R-034): breaker cho `--run-check` và `--evidence` (v3) khi disposition `stop`; `--replace-check` từ chối bản sao hệt; sửa thông báo.
- [x] Slice 7 (R-006): validator allowlist `baseline`; cập nhật `docs/IMPLEMENTATION_PLAN.md` §4, `docs/HARNIX_PRD.md`, `workflow --schema`, cookbook (`.harnix/workflow.md` và template) về `--cwd`.
- [x] Slice 8: `typecheck`, `lint`, `test` (coverage) đều xanh cục bộ (coverage 95.04 / 89.23 / 98.7, sàn được nâng lên 95 / 89 / 98.6); evidence chính thức ghi bằng `--run-check` ở giai đoạn verifying.

## Thứ tự RED rồi GREEN

Mỗi slice 1–7 bắt đầu bằng test thất bại đúng lý do, rồi mới sửa mã.

1. **Slice 1:** RED `test/unit/core/workflow/evidence-time.test.ts` (hàm thuần: từ chối tương lai, cho phép quá khứ và dung sai 5 giây, bỏ qua evidence đã có) và một test `save` (pass tương lai bị từ chối). GREEN: module + hook trong `saveWorkflowLocked`. Kịch bản hồi quy đã tái hiện trong review: pass tương lai rồi fail thật rồi `--finish`.
2. **Slice 2:** RED test validator (`cwd: "../x"`, `"/abs"`, `"C:/x"`, `"a/../../b"` bị từ chối); test `run-check` (`--cwd` khác khai báo bị từ chối, symlink/junction thoát repo bị từ chối); test digest (check có `cwd` đổi thì `taskContractHash` đổi, check không có `cwd` giữ nguyên digest cũ). GREEN: sửa `task-validate.ts`, `run-check.ts`, `input-digest.ts`, `obligations.ts`.
3. **Slice 3:** RED `command-match.test.ts` (tương đương `pnpm test`/`pnpm run test`, bỏ nháy, khác lệnh thì sai) và `run-check.test.ts` (argv `node -e 0` cho check `pnpm run test` bị từ chối, không ghi evidence). GREEN: module + hook.
4. **Slice 4:** RED `suite-gate.test.ts` (inputs đủ nhưng command `pnpm vitest run test/x.test.ts` bị từ chối ở ready và finishing; command khớp được chấp nhận; không có lệnh test xác định thì giữ hành vi cũ). GREEN: sửa `suite-gate.ts`. Rà `test/support/workflow-fixtures.ts` và các test dùng suite check.
5. **Slice 5:** RED test `finish`/`cancel` dùng dependency `lock` giả để chứng minh chạy trong lock và đọc lại task trong lock (evidence fail chèn giữa lúc đọc và ghi làm finish thất bại). GREEN: `withWorkflowLock` trong `support.ts`, dùng ở `save.ts`, `finish.ts`, `cancel.ts`.
6. **Slice 6:** RED test breaker v3: hai fail liên tiếp rồi `--run-check` và `--evidence` bị từ chối; `--replace-check` với replacement trùng hệt bị từ chối, khác `command` thì được. GREEN: kiểm tra trong `run-check.ts`, `evidence-flags.ts`, `evidence.ts` và `plan-edit.ts`.
7. **Slice 7:** RED test validator `baseline` (key lạ, enum sai, kiểu sai bị từ chối) và test docs/contract kiểm §4 có `cwd` và `baseline`. GREEN: validator + tài liệu.

Docs thuần của slice 7 và cookbook dùng ngoại lệ TDD đã ghi, thay bằng test parity template/docs hiện có.

## Mỗi check chứng minh điều gì

- `check-workflow`: toàn bộ test core/utils/workflow cho ac-1, ac-2, ac-3, ac-5, ac-6.
- `check-cwd`: `run-check` và `check-runner` cho ac-4.
- `check-contract`: hợp đồng task v3 và tài liệu cho ac-7.
- `check-typecheck`, `check-lint`, `check-suite`: cổng chất lượng cuối cho ac-8.

## Bảo toàn

Golden snapshot không được sinh lại trừ khi `workflow --schema` đổi có chủ ý (khi đó ghi rõ diff). Worktree có file `.harnix/` và `docs/prompts/harnix-comprehensive-review.md` chưa theo dõi: giữ nguyên. Không commit khi chưa được duyệt. Phiên bản và CHANGELOG do task 6 xử lý.
