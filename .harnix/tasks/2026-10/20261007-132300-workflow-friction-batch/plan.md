# Kế hoạch: gom ma sát vặt

## Checklist

- [x] 1. RED (ac-1): `test/unit/core/workflow/command-match.test.ts` cho `sameCommand`: command khai báo tên trần khớp argv có đường dẫn tuyệt đối (kể cả thư mục có khoảng trắng, dấu gạch ngược, đuôi `.exe`); command khai báo có thư mục chỉ khớp đúng đường dẫn; đối số so đúng từng phần tử (có chuỗi có khoảng trắng); `pnpm run test` vẫn bằng `pnpm test`; trong `run-check.test.ts` một run với đường dẫn tuyệt đối được chấp nhận
- [x] 2. GREEN (ac-1): `sameCommand` trong `src/core/workflow/command-match.ts` (so từng từ qua `splitCommand`); `scripts/measure-tokens.mjs` quay lại `process.execPath`
- [x] 3. RED rồi GREEN (ac-2): `test/workflow/learning-automation.test.ts` kiểm dòng tiêu đề "Project learning (" đứng đầu dòng; sửa `withLearning` trong `src/core/context/effective-context.ts` thêm xuống dòng sau prefix
- [x] 4. RED rồi GREEN (ac-3): `test/integration/commands/workflow-handlers.test.ts` cho `--inspect --task` (task đang planning khác task active, con trỏ không đổi; task kết thúc/không có thì lỗi); `inspectWorkflow` dùng `resolveEditableTask`; thêm `inspect` vào `taskOwner.actions` trong `workflow-flags.ts`
- [x] 5. RED (ac-4): `test/unit/core/workflow/set-criterion.test.ts` (sửa chữ khi planning; sau planning cần `--reason` và thành replan; id lạ, text rỗng; criterion đã có evidence bị từ chối) và một test CLI trong `workflow-handlers.test.ts`
- [x] 6. GREEN (ac-4): `src/core/workflow/set-criterion.ts` (`setCriterionWorkflow` dùng `saveObligationEdit`), export trong `index.ts`, `setCriterion` trong handlers, `--set-criterion <id>` trong `workflow-command.ts`, `workflow-flags.ts` (VALUE_ACTIONS, `--text` và `--reason` cho action mới, thông báo lỗi), `brief.ts`, `schema.ts`
- [x] 7. RED rồi GREEN (ac-5): `test/integration/commands/resume.test.ts`: `resume --epic <id>` khôi phục task kế tiếp theo thứ tự epic, `--dry-run` không ghi, từ chối khi epic hết việc, khi có task active khác và khi dùng cùng `<task-id>`; sửa `src/commands/resume.ts` và đăng ký `[task-id]` cùng `--epic` trong `src/cli-workflow-commands.ts`
- [x] 8. Bề mặt công khai (ac-4, ac-5): `test/workflow/cli-contract.test.ts`, `test/unit/core/workflow/index.test.ts`, `test/unit/commands/workflow-handlers.test.ts`, golden bằng `HARNIX_UPDATE_GOLDEN=1` chỉ phần đổi
- [x] 9. RED rồi GREEN (ac-6): `test/workflow/action-checklist.test.ts` đọc mục "Thêm cờ hoặc action workflow" của `AGENTS.md` và kiểm mọi đường dẫn trong backtick tồn tại; viết mục đó vào `AGENTS.md`
- [x] 10. Tài liệu: cookbook template `workflow.md`, `docs/HARNIX_WORKFLOW.md` (transport `--set-criterion`, `--inspect --task`, `resume --epic`), `docs/HARNIX_PRD.md` mục lệnh công khai `resume`; `pnpm selfhost:sync`
- [x] 11. Bump `pnpm version:sync 2.3.0-dev.10 --summary ... --kind changed` và cập nhật CHANGELOG
- [x] 12. Chạy check-command, check-text, check-resume, check-checklist, check-gates, rồi suite `pnpm run test` (check-1), `pnpm lint`, `pnpm typecheck`; chạy `pnpm build` và `node scripts/measure-tokens.mjs` để xác nhận ac-1 bằng số đo thật

## Thiết kế

`sameCommand(declared, argv)`: `d = splitCommand(declared)`, `a = [...argv]`; bỏ `run` ngay sau package manager ở cả hai; so độ dài; executable: nếu `d[0]` không chứa `/` hay `\` thì so `basename(a[0])` (hạ chữ thường, bỏ `.exe|.cmd|.bat|.ps1`) với `d[0]` đã chuẩn hóa tương tự, ngược lại so đường dẫn đã đổi `\` thành `/` và hạ chữ thường; mọi phần tử còn lại bằng nhau đúng chuỗi. `normalizeCommand` và `equivalentCommand` (so hai chuỗi lệnh) giữ nguyên.

`withLearning`: `${PREFIX}\n${learning}...` ở cả hai nhánh.

`setCriterionWorkflow(root, { id, text }, options, now)`: `activeV3`, kiểm id có thật và text không rỗng, thay `text` của criterion đó, gọi `saveObligationEdit` (tự đi replan sau planning với `--reason`).

`resumeProjectTask(cwd, taskId | undefined, dryRun, epicId?)`: khi có `epicId` thì dùng `detailPublicEpic(...).nextTask` rồi gọi `resumeTask`; hai đối số cùng lúc hoặc không có đối số nào thì lỗi dùng sai.

## Mỗi check chứng minh gì

- `check-command` (ac-1), `check-text` (ac-2, ac-3, ac-4), `check-resume` (ac-5), `check-checklist` (ac-6), `check-gates` (ac-4, ac-5: schema, golden, cli-contract, docs), `check-1`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Hai bề mặt CLI mới cần cập nhật đồng bộ nhiều nơi (đã gom thành bước 8 và 10). So executable theo tên làm lỏng nhẹ ràng buộc argv nên giữ nghiêm với command có thư mục. Hoàn tác bằng revert các tệp đã nêu; không dùng `git checkout` vì còn công việc chưa commit của các task trước.
