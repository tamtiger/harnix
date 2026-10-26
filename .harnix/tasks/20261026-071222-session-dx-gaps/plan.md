# Plan: Gỡ các ma sát gặp khi phát triển harnix (2.22.3)

## Execution Slices

- [ ] [chk-runtime-files] ac-1: thêm `.harnix/tasks/.active` và `.harnix/tmp/` vào `.gitignore`, `git rm --cached .harnix/tasks/.active`; `harnix doctor` báo `active-pointer-tracked` (warning) khi con trỏ đang được git track
- [ ] [chk-runtime-files] ac-2: `eslint.config.mjs` thêm `.harnix/**` vào `ignores`; Prettier bỏ qua qua `.prettierignore`; test hợp đồng cấu hình
- [ ] [chk-no-activate] ac-3: `--no-activate` cho `--init` (đủ năm nơi của checklist cờ), giữ nguyên `.active`
- [ ] [chk-noop-edit] ac-4: `saveObligationEdit` nhận ra bản sửa không đổi và trả thành công, không đổi checkpoint, kèm thông báo "nothing changed"
- [ ] [chk-noop-edit] ac-9: `validateWorkflowSaveEnvelope` nhận ra dạng `{ activeTask, contextDrift }` và nêu cách truyền
- [ ] [chk-lean-output] ac-5: dry-run gọn theo mặc định, `--checklist` hoặc khi có lỗi mới in `reviewChecklist`
- [ ] [chk-lean-output] ac-6: `status --checks`
- [ ] [chk-lean-output] ac-7: bỏ qua decision id `trace-` ở bước chụp learning
- [ ] [chk-release-check] ac-8: `scripts/release-check.mjs` và script `release:check` trong package.json; hàm chạy tuần tự có thể tiêm runner để test không chạy lệnh thật
- [ ] [chk-gates] ac-10: đồng bộ tài liệu (AGENTS.md, README, HARNIX_WORKFLOW, HARNIX_PRD, IMPLEMENTATION_PLAN mục 11, workflow.md và `pnpm selfhost:sync`, skill references); `pnpm version:sync 2.22.3 --kind fixed`
- [ ] [check-suite] lint, typecheck, toàn bộ test và `pnpm release:check`

## Guardrails & Invariants

- Test hồi quy viết trước, thấy đỏ rồi mới sửa.
- Không đổi field/enum đóng băng; golden chỉ đổi đúng chuỗi mới; không hạ coverage hay ngân sách token.
- Không xóa file `.active` hay `.harnix/tmp/` của người dùng; chỉ ignore và gỡ khỏi index.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1, ac-2 | chk-runtime-files |
| ac-3 | chk-no-activate, chk-gates |
| ac-4, ac-9 | chk-noop-edit |
| ac-5, ac-6 | chk-lean-output, chk-gates |
| ac-7 | chk-lean-output |
| ac-8 | chk-release-check, chk-gates |
| ac-10 | chk-gates |
| tất cả | check-suite |
