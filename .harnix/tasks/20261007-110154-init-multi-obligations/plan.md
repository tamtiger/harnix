# Kế hoạch: --init nhiều tiêu chí và check

## Checklist

- [x] 1. RED (ac-2): `test/unit/core/workflow/init-spec.test.ts` cho `parseCheckSpec` (đủ khóa; danh sách ngăn bằng dấu cộng; scope mặc định `focused`; thiếu `id`, `command`, `criteria` hoặc `input` thì lỗi nêu tên khóa; khóa lạ, khóa lặp, scope sai và đặc tả rỗng bị từ chối)
- [x] 2. GREEN (ac-2): `src/core/workflow/init-spec.ts` (`parseCheckSpec`, kiểu `InitCheckSpec`)
- [x] 3. RED (ac-1, ac-2, ac-4): trong `test/unit/core/workflow/init-task.test.ts`: nhiều criterion thành `ac-1..n` theo thứ tự, check mặc định phủ tất cả; `checks` thêm check bắt buộc; criterion lạ hoặc id trùng bị từ chối; lệnh test của dự án cho `check-suite`/`full`/mô tả tiếng Việt, lệnh khác giữ `check-1`/`focused`; cập nhật các test đang kỳ vọng `check-1` focused (ac-3)
- [x] 4. GREEN: `src/core/workflow/init-task.ts` (`criteria: string[]` thay `criterion`, `checks`, chuẩn hóa check mặc định bằng `equivalentCommand` với lệnh test của `verify-plan`)
- [x] 5. CLI (ac-1, ac-2): `--text` nhận nhiều giá trị (chỉ `--init`, lệnh khác báo lỗi nếu lặp), `--with-check <spec>` lặp (chỉ `--init`) trong `workflow-command.ts`, `workflow-flags.ts` (kiểu, `FLAG_OWNERS`), `workflow-lifecycle-handlers.ts`, `workflow-handlers.ts` (ép kiểu `text`); test trong `test/integration/commands/workflow-handlers.test.ts`
- [x] 6. Contract (ac-3): `schema.ts` dòng `--init`, `test/workflow/cli-contract.test.ts`, golden bằng `HARNIX_UPDATE_GOLDEN=1` chỉ cho phần đổi (theo `r-surface-lists`)
- [x] 7. Tài liệu (ac-3): cookbook `src/templates/harnix/workflow.md`, đoạn `--init` trong `docs/HARNIX_WORKFLOW.md`; `pnpm selfhost:sync`
- [x] 8. Bump `pnpm version:sync 2.3.0-dev.6 --summary ... --kind added` và cập nhật CHANGELOG
- [x] 9. Chạy check-init, check-gates, rồi suite `pnpm run test`, `pnpm lint`, `pnpm typecheck` (check-suite)

## Thiết kế

`parseCheckSpec(spec)`: tách theo `;` thành `khóa=giá trị` (giá trị có thể chứa `=`; cắt ở dấu `=` đầu tiên); khóa hợp lệ `id`, `command`, `criteria`, `input`, `scope`, `description`; `criteria` và `input` tách theo `+`; trả `InitCheckSpec { id, command, criterionIds, inputs, scope, description? }` đã sắp xếp và khử trùng cho mảng; lỗi dạng `--with-check "<spec>": missing key criteria` hoặc `unknown key <k> (allowed: ...)`.

`initTaskWorkflow`: tiêu chí `criteria[i]` có id `ac-(i+1)` (nếu rỗng thì dùng title như cũ); check mặc định phủ mọi criterion; mỗi `checks[i]` thành `{ id, description: description ?? id, scope, required: true, command, criterionIds, inputs }`; mọi thứ qua `saveWorkflow` nên id trùng, criterion lạ, thiếu inputs bị từ chối bởi bộ kiểm tra có sẵn.

CLI: `--text` dùng reducer `(value, previous) => [...[previous ?? []].flat(), value]` để `flags.text` là mảng khi lặp; `assertFlagGroups` từ chối `--text` lặp ngoài `--init` và `--with-check` ngoài `--init`; các handler khác dùng một giá trị.

## Mỗi check chứng minh gì

- `check-init` (ac-1, ac-2, ac-3, ac-4): đặc tả check, nhiều criterion, chuẩn hóa check mặc định, cờ CLI và hành vi cũ khi một `--text`.
- `check-gates` (ac-3): cli-contract, schema/golden, docs và ngân sách instruction nhất quán.
- `check-suite`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Đổi `--text` sang nhận nhiều giá trị có thể làm lệnh khác nhận mảng; `assertFlagGroups` chặn và có test. Đổi id/scope/mô tả check mặc định làm test cũ phải cập nhật. Hoàn tác bằng revert các file đã nêu.
