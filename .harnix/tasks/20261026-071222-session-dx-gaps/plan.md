# Plan: Gỡ các ma sát gặp khi phát triển harnix (2.22.3)

## Execution Slices

- [x] [chk-runtime-files] ac-1: thêm `.harnix/tasks/.active` `.harnix/tmp/` và `.harnix/cache/` vào `.gitignore`, `git rm --cached` cho `.harnix/tasks/.active` và `.harnix/cache/repo-map-v1.json`; `harnix doctor` báo `active-pointer-tracked` (warning) khi con trỏ đang được git track (git qua process runner được tiêm)
- [x] [chk-runtime-files] ac-2: `eslint.config.mjs` thêm `.harnix/**` vào `ignores`; `.prettierignore` đã có `.harnix`; test hợp đồng cấu hình giữ cả hai
- [x] [chk-no-activate] ac-3: `--no-activate` cho `--init` (đủ năm nơi của checklist cờ), giữ nguyên `.active`
- [x] [chk-noop-edit] ac-4: `saveObligationEdit` nhận ra bản sửa không đổi và trả thành công, không đổi checkpoint, kèm thông báo "nothing changed"
- [x] [chk-noop-edit] ac-9: `validateWorkflowSaveEnvelope` nhận ra dạng `{ activeTask, contextDrift }` và nêu cách truyền
- [x] [chk-lean-output] ac-5: dry-run gọn theo mặc định; `reviewChecklist` chỉ in với `--checklist`, khi có lỗi, hoặc khi đích là `ready/ready` của task Full; cập nhật `workflow.md` và skill `harnix-plan`
- [x] [chk-lean-output] ac-6: `status --checks`
- [x] [chk-lean-output] ac-7: bỏ qua decision id `trace-` ở bước chụp learning
- [x] [chk-release-check] ac-8: `scripts/release-check.mjs` và script `release:check` trong package.json; hàm chạy tuần tự có thể tiêm runner để test không chạy lệnh thật; cập nhật `test/workflow/package-contract.test.ts` và danh sách Required package scripts trong AGENTS.md
- [x] [chk-gates] ac-10: đồng bộ tài liệu (AGENTS.md, README, HARNIX_WORKFLOW, HARNIX_PRD, IMPLEMENTATION_PLAN mục 11, workflow.md và `pnpm selfhost:sync`, skill references); `pnpm version:sync 2.22.3 --kind added` (hoặc `changed`)
- [x] [chk-footprint] ac-10: `pnpm measure:footprint`; nếu vượt thì nâng `maxBytes` bằng số đo làm tròn lên 1 KiB kèm lý do ở changelog
- [x] [chk-lint] ac-2, ac-3, ac-8: `pnpm lint` xanh
- [x] [chk-typecheck] ac-3 đến ac-7, ac-9: `pnpm typecheck` xanh
- [x] [check-suite] toàn bộ test kèm coverage và `pnpm release:check`

## Guardrails & Invariants

- Test hồi quy viết trước, thấy đỏ rồi mới sửa.
- Không đổi field/enum đóng băng; golden chỉ đổi đúng chuỗi mới; không hạ coverage hay ngân sách token.
- Không xóa file `.active` hay `.harnix/tmp/` của người dùng; chỉ ignore và gỡ khỏi index.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1, ac-2 | chk-runtime-files, chk-lint |
| ac-3 | chk-no-activate, chk-gates |
| ac-4, ac-9 | chk-noop-edit |
| ac-5, ac-6 | chk-lean-output, chk-gates |
| ac-7 | chk-lean-output |
| ac-8 | chk-release-check, chk-gates |
| ac-10 | chk-gates, chk-footprint |
| ac-3 đến ac-9 | chk-typecheck |
| tất cả | check-suite |
