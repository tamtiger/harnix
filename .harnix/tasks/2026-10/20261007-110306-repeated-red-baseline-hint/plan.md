# Kế hoạch: gợi ý baseline khi suite đỏ lặp

## Checklist

- [x] 1. RED (ac-1, ac-2, ac-3): `test/unit/core/workflow/baseline-hint.test.ts` cho `baselineHint(root, task)`: hai task kết thúc gần nhất có suite cùng command đỏ thì có gợi ý; chỉ một task đỏ, task mới nhất xanh, command khác, task `planning` hoặc check đã có baseline ủy quyền thì không; gợi ý là một dòng, nêu id check và `--set-baseline ... --authorized-by user`; task đọc lỗi bị bỏ qua
- [x] 2. GREEN: `src/core/workflow/baseline-hint.ts` (`baselineHint`)
- [x] 3. RED (ac-1, ac-3): `test/unit/core/workflow/preflight.test.ts`: preflight trả `baselineHint` ở `in_progress`, không ở `planning`, và `--brief` (`briefPreflight`) giữ nguyên trường
- [x] 4. GREEN: `preflightWorkflow` trong `src/core/workflow/preflight.ts` gắn `baselineHint` (kiểu `WorkflowPreflightResultV1` có trường tùy chọn mới)
- [x] 5. Schema và tài liệu (ac-2): dòng `--preflight` trong `src/core/workflow/schema.ts`, `docs/HARNIX_WORKFLOW.md` và template `src/templates/harnix/workflow.md` nêu `baselineHint`; golden bằng `HARNIX_UPDATE_GOLDEN=1` chỉ cho chuỗi schema đổi; `pnpm selfhost:sync`
- [x] 6. Bump `pnpm version:sync 2.3.0-dev.8 --summary ... --kind added` và cập nhật CHANGELOG
- [x] 7. Chạy check-hint, check-gates, rồi suite `pnpm run test` (check-1), `pnpm lint`, `pnpm typecheck`

## Thiết kế

`baselineHint(root, task)` (không throw, trả `string | undefined`):

1. Chỉ khi `task.schemaVersion === 3` và `task.status` là `in_progress` hoặc `verifying`.
2. `suites` = check của task có `scope === "full"`, có `command`, chưa có `baseline.authorizedBy`; không có thì `undefined`.
3. Đọc tối đa 8 thư mục `tasks/<id>` mới nhất (sắp giảm dần theo id, bỏ `task.id`), đường dẫn qua `resolveSafeProjectPath`, mỗi `task.json` ≤ 1 MiB qua `validateTask`; lỗi đọc thì bỏ qua thư mục đó.
4. Giữ task `completed` hoặc `cancelled`. Với mỗi suite hiện tại, lấy từ mỗi task kết thúc check `scope === "full"` có `normalizeCommand` bằng nhau; "đỏ" nếu `selectLatestEvidence` là `fail` hoặc `baseline.result === "fail"`. Hai task mới nhất có check như vậy cùng đỏ thì có gợi ý cho suite đó (lấy suite đầu tiên theo thứ tự khai báo).
5. Chuỗi: `Suite '<id>' was red in the last 2 finished tasks; if it is still red before your change, ask the user to authorize it once: harnix workflow --set-baseline <id> --result fail --classification pre-existing --authorized-by user --scope "<why>" (never set it yourself).`

`preflightWorkflow` gọi `baselineHint` sau khi định tuyến (bọc try/catch để không bao giờ chặn) và thêm `baselineHint` vào kết quả khi có; `briefPreflight` chỉ bỏ `learning` nên giữ nguyên.

## Mỗi check chứng minh gì

- `check-hint` (ac-1, ac-2, ac-3): điều kiện xuất hiện, nội dung, không đặt baseline, tích hợp preflight và `--brief`.
- `check-gates` (ac-2): schema, golden, docs và ngân sách instruction nhất quán.
- `check-1`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Thêm trường tùy chọn vào preflight nên không phá hợp đồng; hoàn tác bằng revert `baseline-hint.ts`, `preflight.ts` và các tài liệu. Preflight ở `in_progress`/`verifying` đọc thêm tối đa 8 file nhỏ.
