# Kế hoạch: workflow --run-checks

## Checklist

- [x] 1. RED: test `splitCommand` trong `test/unit/core/workflow/command-match.test.ts` (tách theo khoảng trắng, giữ chuỗi trong nháy, `sameCommand` vẫn khớp lệnh gốc)
- [x] 2. GREEN: `splitCommand` trong `src/core/workflow/command-match.ts`
- [x] 3. RED: `test/unit/core/workflow/run-checks.test.ts` (ac-1: thứ tự focused trước suite, bỏ qua check passed, ghi evidence, dừng ở fail và liệt kê remaining; ac-2: hình dạng output, không có outputTail khi pass; ac-3: breaker stop và thiếu command thì ném lỗi nêu id và không chạy gì)
- [x] 4. GREEN: `src/core/workflow/run-checks.ts` (`runChecksWorkflow`), export trong `src/core/workflow/index.ts`
- [x] 5. Nối CLI: `runChecks` trong `WORKFLOW_HANDLERS`, `--run-checks` trong `workflow-command.ts`, `workflow-flags.ts` (BOOLEAN_ACTIONS, thông báo lỗi), `brief.ts` (BRIEF_ACTIONS), `schema.ts` (transport mới); thêm test cờ vào `test/integration/commands/workflow-flags.test.ts`; cập nhật `behavior-snapshot.golden.json` bằng `HARNIX_UPDATE_GOLDEN=1` chỉ cho trường schema mới
- [x] 6. Tài liệu ac-4: cookbook của `src/templates/harnix/workflow.md` (và `docs/HARNIX_WORKFLOW.md` nếu test docs yêu cầu), `src/skills/harnix-verify/SKILL.md`; chạy `pnpm selfhost:sync`
- [x] 7. Bump `pnpm version:sync 2.3.0-dev.2 --summary ... --kind added` và cập nhật CHANGELOG
- [x] 8. Chạy check-runchecks, check-gates, rồi suite `pnpm run test`, `pnpm lint`, `pnpm typecheck` (check-suite)

## Thiết kế

`runChecksWorkflow(root, { runner, now })`:

1. `resolveActiveTask`, yêu cầu schema v3.
2. `inspectRequiredChecks` lấy trạng thái; `todo` = check bắt buộc có trạng thái khác `passed`.
3. Kiểm tra trước toàn bộ `todo`: `verificationRetryDisposition(task, id) === "stop"` hoặc thiếu `command` thì ném lỗi (không chạy gì).
4. Sắp `todo`: `scope === "focused"` trước, giữ thứ tự khai báo.
5. Với mỗi check gọi `runCheckWorkflow(root, id, splitCommand(command), { runner, now })`; thêm `{ id, result, exitCode }` vào `ran`; check fail kèm `outputTail` rồi dừng; phần còn lại vào `remaining`.

`splitCommand` chỉ tách theo khoảng trắng ngoài nháy đơn/đôi và bỏ nháy; `sameCommand` trong `runCheckWorkflow` đã bỏ nháy khi so sánh nên argv luôn khớp command khai báo.

## Mỗi check chứng minh gì

- `check-runchecks` (ac-1, ac-2, ac-3): hành vi lõi và cờ CLI.
- `check-gates` (ac-4): cli-contract, docs, skill sources, instruction budget, golden vẫn xanh.
- `check-suite`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Thêm một action mới, không đổi action sẵn có; golden chỉ đổi phần schema. Hoàn tác bằng revert các file đã nêu. Nếu ngân sách instruction của template vượt, rút gọn câu cookbook thay vì nới ngưỡng.
