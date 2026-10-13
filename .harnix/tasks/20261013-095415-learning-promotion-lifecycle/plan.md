# Kế hoạch: vòng đời learning

Thứ tự RED rồi GREEN cho từng slice; tick `[x]` ngay khi xong. Tiêu chí ac-1..ac-4 xem `prd.md`.

- [x] S1 Review core (ac-2): `src/core/journal/learning-review.ts` với `reviewLearning(journalRoot, journalPath, developer, id, action, now, reason?)` ghi entry mới (`kind: learning`, id duy nhất `${id}-${status}-<mốc thời gian>`), kiểm tra bảng chuyển trạng thái, chỉ nhận `reject` và `promote` từ `draft|candidate`, từ chối `archived`/`promoted`/`rejected`. Test RED trước trong `test/unit/core/journal/learning-review.test.ts`.
- [x] S2 Promote core (ac-1, ac-2): `src/core/journal/learned-promote.ts` dùng `promotionProposal` và `atomicWriteFile` để thêm khối có marker vào `.harnix/spec/learned.md` (đường dẫn qua `resolveSafeProjectPath`), idempotent theo marker, giữ nội dung sẵn có, marker mang `paths=` lấy từ `relevantPaths` của task nguồn, từ chối khi đã đủ 40 khối, rồi mới ghi status `promoted`. Thêm `retireLearning` gỡ khối theo marker và ghi entry `archived` (ac-5). Test: tạo file mới, thêm vào file có sẵn nội dung người dùng, promote lặp lại không nhân đôi, dry-run không ghi.
- [x] S3 Xếp hạng theo độ liên quan (ac-1, ac-2): mở rộng `summarizeLearning` nhận `activePaths` và bộ `sourcePaths(taskId)` được tiêm, rank `candidate` > giao nhau `relevantPaths` > độ mới, loại `promoted`; nối vào `effective-context.ts` và `preflight`/`support.ts`. Thêm `src/core/journal/learned-spec.ts` đọc `.harnix/spec/learned.md`, tách khối theo marker, chọn tối đa 5 khối và 2.000 ký tự theo giao nhau `relevantPaths` rồi độ mới, và render trong khung untrusted; nối vào `effective-context.ts` (ac-1, ac-5). Test: khối không liên quan không được nạp, vượt trần bị cắt đúng, không có file thì không đổi. Test trên `learning-summary.test.ts`, có ca không có path nào khớp thì giữ hành vi cũ.
- [x] S4 Lệnh `harnix learning` (ac-2, ac-3): `src/commands/learning.ts` (liệt kê kèm số khối và kích thước; hành động bằng cờ loại trừ nhau `--reject <id> [--reason]`, `--retire <id>`, `--promote <id> [--apply]`; không subcommand, không có `approve`; test cả cờ sai ngữ cảnh như `--apply` không có `--promote`), đăng ký trong `src/cli-workflow-commands.ts`, tuân thủ danh sách "Thêm cờ hoặc action" của AGENTS.md (không dùng `node:fs` trực tiếp trong command nếu thuộc danh sách architecture). Test tích hợp `test/integration/commands/learning.test.ts`: danh sách, reject, `--promote` dry-run và `--promote --apply`, id sai, chuyển trạng thái sai.
- [x] S5 Tài liệu và bề mặt (ac-3, ac-4): `docs/HARNIX_WORKFLOW.md` (mục learning), `docs/HARNIX_PRD.md` (lệnh công khai), `src/templates/harnix/workflow.md` rồi `pnpm selfhost:sync`, skill `harnix-plan`/`harnix-verify` nhắc `harnix learning`, `test/workflow/cli-contract.test.ts`, golden chỉ cho chuỗi mới (`HARNIX_UPDATE_GOLDEN=1`), `AGENTS.md` nếu mô tả learning.
- [x] S6 Phát hành (ac-3): `pnpm version:sync 2.4.0-dev.1 --summary "<tóm tắt>" --kind added` và cập nhật CHANGELOG một lần trước `verifying`; `pnpm format`.

## Kiểm chứng

- `check-lifecycle` (focused): `pnpm exec vitest run test/unit test/integration` phủ ac-1, ac-2, ac-4, ac-5.
- `check-gates` (focused): `pnpm run test:gates` phủ ac-1..ac-4, gồm cli-contract, architecture, docs, golden.
- `check-suite`: `pnpm run test`.

## Rủi ro và rollback

- Ghi `.harnix/spec/learned.md` là thay đổi file người dùng: chỉ khi có `--apply`, atomic, idempotent; hoàn tác bằng git của người dùng.
- Statement là dữ liệu untrusted: luôn render qua `JSON.stringify` trong khung cố định, không echo giá trị rủi ro.
- Trạng thái `archived` do tính khi đọc; mục lapse không duyệt được, người dùng phải chờ capture lại.
