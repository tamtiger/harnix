# Kế hoạch — Khôi phục gate xanh cho HEAD 2.0.4

## Checklist theo slice

- [x] Slice 1: sửa lỗi kiểu trong `src/commands/workflow-command.ts` (import type `TaskRecord`; `InitTaskOptions` với `exactOptionalPropertyTypes`).
- [x] Slice 2: sửa lỗi kiểu trong `test/unit/core/workflow/transition.test.ts`, `batch.test.ts`, `test/workflow/localized-time.test.ts` bằng thu hẹp kiểu (union `TaskRecord | DryRunTransitionResult`, `TaskRecordV1`).
- [x] Slice 3: tách `src/core/workflow/batch.ts` thành các module nhỏ theo trách nhiệm (validate envelope, áp criteria/checks, áp decisions/risks/paths); giữ nguyên hành vi, ≤ 300 dòng, complexity ≤ 20.
- [x] Slice 4: giải quyết các lỗi lint thực tế: complexity của `inspectReadyConditions` (ready.ts) và `replaceCheckWorkflow` (plan-edit.ts), `max-lines` của `workflow-command.ts` (tách `workflow-handlers.ts`); chạy `pnpm run format`.
- [x] Slice 5: viết test cho các nhánh chưa phủ của `src/core/workflow/ready.ts` (72.97%) và `src/core/workflow/save-files.ts` (71.61%) cùng các module mới tách, đưa coverage về trên sàn.
- [x] Slice 6: cập nhật `docs/IMPLEMENTATION_PLAN.md` §11 và `package.json` `test:acceptance` để chạy `pnpm run test` có coverage; thêm test cấu trúc.
- [x] Slice 7: `typecheck`, `lint`, `test` (coverage) đều exit 0 cục bộ; evidence chính thức được ghi bằng `harnix workflow --run-check` ở giai đoạn verifying.

## Thứ tự RED rồi GREEN

1. Slice 1–2 (kiểu): RED là `pnpm run typecheck` đang exit 2; GREEN là exit 0. Không cần test mới (ngoại lệ TDD: sửa kiểu thuần).
2. Slice 3 (tách module): bảo toàn hành vi bằng `test/unit/core/workflow/batch.test.ts` và `test/workflow/internal-workflow-save.test.ts` hiện có; chạy trước và sau, kết quả phải như nhau. Golden snapshot không được sinh lại.
3. Slice 5 (coverage): viết test thất bại cho nhánh chưa phủ trước, rồi xác nhận pass với mã hiện có; không sửa mã để "làm tăng coverage".
4. Slice 6: test cấu trúc kiểm `test:acceptance` và §11 chứa lệnh có coverage, thất bại khi bị bỏ.

## Mỗi check chứng minh điều gì

- `check-focused`: test workflow và command liên quan vẫn xanh sau khi tách module (ac-1, ac-2, ac-3).
- `check-docs`: tài liệu acceptance và cấu trúc test khớp (ac-4).
- `check-typecheck`, `check-lint`, `check-suite`: cổng chất lượng cuối (ac-5).

## Bảo toàn

Worktree hiện có các tệp `.harnix/` của epic và `docs/prompts/harnix-comprehensive-review.md` chưa theo dõi: giữ nguyên, không đưa vào thay đổi sản phẩm. Không commit khi chưa được duyệt.
