# Plan - Sửa backlog lỗi do Harnix gây ra

Đã chốt phân loại cho toàn bộ 19 mục: 2 mục đã giải quyết (HX-13, HX-18), 1 mục từ chối có lý do (HX-12), 16 mục chọn sửa và kiểm chứng qua test suite.

## Slices

- [x] S1. Cải thiện thông báo lỗi và chẩn đoán (HX-01, HX-02, HX-09, HX-16):
  - Chi tiết missing criterion reference trong `task-validate-contracts.ts` (HX-01).
  - Loại bỏ "for v2" và làm rõ hướng dẫn dùng `--reason` khi freeze obligations trong `obligations.ts` (HX-02, HX-09).
  - Chi tiết trường lỗi và ràng buộc vi phạm trong `src/core/repo-map/store.ts` (HX-16).
- [x] S2. Tiện ích và Ergonomics của CLI & Workflow (HX-08, HX-10, HX-05):
  - `workflow --run-check --brief` loại bỏ `outputTail` (HX-08).
  - `workflow --set-check --input` tự động tách chuỗi comma-separated qua `flatMap splitList` (HX-10).
  - Giới hạn tối đa 5 con trỏ `task reference` unpersisted trong context để chống token bloat (HX-05).
- [x] S3. Tính đúng đắn của Reconcile & CLI Update (HX-03, HX-04):
  - Chuẩn hóa CRLF -> LF khi so sánh content hash trong `decision.ts` để chống nhận nhầm modified file trên Windows autocrlf (HX-03).
  - Bổ sung cờ `--dry-run` cho `harnix update` ở phạm vi project trong `cli-project-commands.ts` và `update.ts` (HX-04).
- [x] S4. Mở rộng Repo Map & Dev Tooling (HX-17, HX-19, HX-15):
  - Bóc tách `using` C# vào `importTargets` trong `src/core/repo-map/extract.ts` (HX-17).
  - Thêm stub `bin/harnix.js` chuyển tiếp tới `../dist/cli.js` (HX-19).
  - Format tự động các file sau khi sync trong `scripts/version-sync.mjs` (HX-15).
- [x] S5. Cải tiến tài liệu & kỹ năng Agent (HX-06, HX-07, HX-11, HX-14):
  - Bổ sung hướng dẫn chạy lint và format trước khi verify trong `harnix-implement` (HX-06, HX-11).
  - Khuyến nghị dùng `pwsh` 7.4+ cho JSON có dấu trên Windows trong `workflow.md` cookbook (HX-07).
  - Hướng dẫn quy ước mirror test layout của `test-structure.test.ts` ngay trong `harnix-plan` (HX-14).
- [x] S6. Verification & Đồng bộ gói:
  - Chạy toàn bộ các unit checks hẹp và `chk-suite` toàn diện (`pnpm lint && pnpm typecheck && pnpm test`).
  - Cập nhật CHANGELOG và sync version nếu cần.

## Kiểm chứng

Từng lát cắt có unit test kiểm chứng trước (RED -> GREEN), sau đó chạy `chk-suite` toàn diện.

## Rủi ro

- Tránh breaking changes đối với schema v3 và API public.
- Giữ vững giới hạn <= 300 dòng code cho mỗi file TypeScript.
