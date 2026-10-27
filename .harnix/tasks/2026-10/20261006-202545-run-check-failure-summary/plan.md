# Kế hoạch: tóm tắt lỗi check và lỗi launcher

## Checklist

- [x] 1. RED: `test/unit/core/workflow/check-output.test.ts` (ac-1: báo cáo vitest mẫu cho tối đa 10 mục và 800 ký tự, tên test cùng dòng thông điệp đầu; ac-2: output lạ rút còn 600 ký tự cuối; ac-3: đường dẫn tuyệt đối thành `<path>`, mã ANSI bị bỏ; ac-5: `launcherFailure` khớp từng mẫu hẹp và không khớp output test đỏ)
- [x] 2. GREEN: `src/core/workflow/check-output.ts` (`summarizeCheckOutput`, `launcherFailure`)
- [x] 3. RED rồi GREEN trong `run-check.test.ts` và `run-checks.test.ts` (ac-2, ac-5): fail trả tóm tắt, pass trả `outputTail` rỗng; output launcher ném "could not start" và không ghi evidence, hai lần liên tiếp không kích hoạt breaker; test đỏ thật vẫn ghi fail; sửa `src/core/workflow/run-check.ts` và `run-checks.ts`
- [x] 4. CLI (ac-4): `runCheck` và `runChecks` trong handlers chỉ trả `outputTail` khi fail, kể cả `--brief`; cập nhật test trong `workflow-command.test.ts` và `workflow-handlers.test.ts` (đang kỳ vọng `outputTail` khi pass)
- [x] 5. Tài liệu và schema: dòng `--run-check` trong `schema.ts`, cookbook của `src/templates/harnix/workflow.md`, đoạn verify trong `docs/HARNIX_WORKFLOW.md`; `HARNIX_UPDATE_GOLDEN=1` chỉ cho chuỗi schema đổi; `pnpm selfhost:sync`
- [x] 6. Bump `pnpm version:sync 2.3.0-dev.3 --summary ... --kind changed` và cập nhật CHANGELOG
- [x] 7. Chạy check-summary, check-cli, check-gates, rồi suite `pnpm run test`, `pnpm lint`, `pnpm typecheck` (check-suite)

## Thiết kế

`check-output.ts`:

- `stripAnsi`, `redactPaths` (chuỗi bắt đầu bằng ổ đĩa Windows hoặc `/` với từ hai đoạn trở lên thành `<path>`).
- `summarizeCheckOutput(output)`: làm sạch; gom các khối `FAIL  <ref>` (ref bỏ phần file, giữ tên test) với dòng không rỗng kế tiếp làm thông điệp, tối đa 10 mục, cắt ở 800 ký tự; không có khối nào thì `slice(-600)`.
- `launcherFailure(output, exitCode)`: `undefined` khi exit 0 hoặc không khớp; ngược lại trả lý do một dòng, bỏ qua khi output đã có khối `FAIL` của vitest.

`runCheckWorkflow`: sau khi chạy, nếu `launcherFailure` có giá trị thì ném `Check <id> could not start: <reason>; nothing was recorded.` trước khi so digest và ghi evidence. `RunCheckResult.outputTail` = tóm tắt khi fail, `""` khi pass. `runChecksWorkflow` dùng cùng giá trị (lỗi launcher lan ra như lỗi của lệnh; các check đã pass trước đó vẫn được ghi).

## Mỗi check chứng minh gì

- `check-summary` (ac-1, ac-2, ac-3, ac-5): tóm tắt, che đường dẫn, nhận diện launcher, không lưu output.
- `check-cli` (ac-4): `--brief` vẫn in tóm tắt khi fail, không in khi pass.
- `check-gates` (ac-4): schema, docs và golden vẫn nhất quán.
- `check-suite`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Đổi nhẹ hợp đồng output của `--run-check` (pass không còn `outputTail`); hoàn tác bằng revert các file đã nêu. Thêm hoặc đổi mô tả trong schema phải cập nhật golden và đoạn docs song song (xem risk `r-surface-lists` của task init-multi-obligations).
