# Kế hoạch: secretAdvisory khi finish

## Checklist

- [x] 1. RED (ac-2, ac-3): `test/unit/core/workflow/secret-scan.test.ts` cho `scanTaskSecrets(root, task)`: từng luật phát hiện (private key, token AWS/GitHub, JWT, connection string, `"Password": "..."`), placeholder và file sạch không báo, kết quả không chứa giá trị secret, phạm vi gồm cả `relevantPaths` và input của check, giới hạn 200 file và 128 KiB, bỏ file nhị phân, không theo symlink ra ngoài, tối đa 5 mục sắp theo đường dẫn, lỗi quét trả `undefined`
- [x] 2. GREEN: `src/core/workflow/secret-scan.ts` (`scanTaskSecrets`, kiểu `SecretAdvisory`)
- [x] 3. RED (ac-1): `test/support/learning-fixtures.ts` cho `completeTaskWithDecisions` nhận `relevantPaths` và trả `FinishReport`; trong `test/unit/core/workflow/finish.test.ts` hoặc `secret-scan.test.ts` kiểm `finishWorkflowReport` có `secretAdvisory` khi file chứa secret và không có khi sạch; trong `test/integration/commands/workflow-handlers.test.ts` kiểm `--finish --brief` in `secretAdvisory` còn `--finish` thường không
- [x] 4. GREEN: `finishLocked` trong `src/core/workflow/finish.ts` gọi `scanTaskSecrets` sau khi hoàn tất (bọc để không bao giờ làm finish lỗi), `FinishReport.secretAdvisory?`; handler `finish` trong `src/commands/workflow-handlers.ts` thêm vào output brief
- [x] 5. Schema và tài liệu (ac-1): dòng `--finish` trong `schema.ts`, `docs/HARNIX_WORKFLOW.md`, template `workflow.md` và `--finish` trong skill `harnix-verify`; golden bằng `HARNIX_UPDATE_GOLDEN=1` chỉ cho chuỗi đổi; `pnpm selfhost:sync`
- [x] 6. Bump `pnpm version:sync 2.3.0-dev.9 --summary ... --kind added` và cập nhật CHANGELOG
- [x] 7. Chạy check-secret, check-gates, rồi suite `pnpm run test` (check-1), `pnpm lint`, `pnpm typecheck`

## Thiết kế

`scanTaskSecrets(root, task)` trả `Promise<SecretAdvisory | undefined>` với `SecretAdvisory = { files: number; findings: { path: string; rule: string }[] }`:

1. Mẫu glob = `relevantPaths` + input của mọi check (bỏ `@task-contract`, glob phủ định); `globby(patterns, { cwd: root, onlyFiles: true, followSymbolicLinks: false, dot: true, gitignore: false, ignore: buildGlobIgnores(...) })`, sắp tăng dần, lấy tối đa 200.
2. Mỗi file: `resolveSafeProjectPath(root, path)` (từ chối thoát/symlink), `stat` bỏ file > 128 KiB, đọc, bỏ file có byte NUL.
3. Mỗi luật chạy trên nội dung; chỉ lưu `{ path, rule }` của luật đầu tiên khớp (sau khi loại giá trị placeholder), không lưu nội dung khớp.
4. `files` = số file có ít nhất một dấu hiệu; `findings` sắp theo đường dẫn, cắt còn 5. Trả `undefined` khi `files === 0` hoặc khi có lỗi bất kỳ.

`finish.ts`: `secretAdvisory` được tính trong `finishLocked` sau `finishWorkflowTask` và đưa vào `FinishReport` khi có; handler brief spread trường này.

## Mỗi check chứng minh gì

- `check-secret` (ac-1, ac-2, ac-3): phát hiện, phạm vi, giới hạn, an toàn đường dẫn, không lộ giá trị, tích hợp finish và `--brief`.
- `check-gates` (ac-1): schema, golden, docs và ngân sách instruction nhất quán.
- `check-1`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Thêm trường tùy chọn vào báo cáo finish nên không phá hợp đồng; hoàn tác bằng revert `secret-scan.ts`, `finish.ts`, handler và tài liệu. Dương tính giả trên file test chỉ là advisory.
