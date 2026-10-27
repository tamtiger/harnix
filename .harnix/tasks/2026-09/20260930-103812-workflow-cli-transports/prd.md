# PRD — Bổ sung transport CLI cho evidence, criterion, migrate v3 và chạy check

## Vấn đề

Agent (đặc biệt Kiro trên Windows PowerShell) phải tự viết script `.ps1`/`.json` tạm để: đánh dấu criterion `met` (regex sửa `task.json` rồi `--save` cả record), ghi evidence (`cmd /c "... < file"`), lọc output vì mọi lệnh mutating in nguyên TaskRecord, tự bịa `recordedAt`, tự snapshot trước/sau bằng script, và migrate task legacy v1/v2 lên v3 bằng envelope dựng tay. CLI hiện chỉ có `--transition` và `--snapshot` dùng gọn được.

## Phạm vi

- Trong phạm vi: các transport mới của hidden `harnix workflow` (`--evidence` dạng flag, `--criterion --met`, `--migrate`, `--run-check`, `--brief`), module `src/core/workflow/*` tương ứng, `src/commands/workflow-command.ts` (tách wiring khỏi `cli-program.ts`), `workflow --schema`, PRD/WORKFLOW/IMPLEMENTATION_PLAN §4.
- Ngoài phạm vi: `--file` (khuyến khích file tạm trong repo, làm bẩn digest, thêm bề mặt path-safety), chạy command qua shell, đổi stdin envelope hiện có, đổi schema TaskRecord, sửa skill/template (task 3 của epic).

## Hợp đồng chính xác

- `--evidence --check <id> --result pass|fail|skipped --summary <text> [--exit-code <n>] [--artifact <path>]... [--digest <hex>]`: CLI tự điền `id` = `ev-<checkId>-<n>` (n nhỏ nhất chưa dùng), `recordedAt` = clock đã cấu hình, `artifactPaths` = các `--artifact` (mặc định rỗng), `inputDigest` = `--digest` hoặc digest tính ngay khi check là v3 required và result là pass/fail. `--exit-code` bắt buộc với pass/fail. Không trộn với stdin envelope: có `--result` thì đọc flag, ngược lại đọc stdin như cũ. Save guard hiện có vẫn quyết định chấp nhận hay từ chối.
- `--criterion <id>[,<id>...] --met [--evidence-ids <id>[,<id>...]]`: chỉ cho task v3. Mặc định `evidenceIds` của mỗi criterion là evidence mới nhất của các required check bao phủ criterion đó, với điều kiện là pass và `inputDigest` khớp digest hiện tại; thiếu pass tươi thì từ chối và nêu criterion. Với `--evidence-ids`, mỗi id phải tồn tại, là pass và thuộc check có `criterionIds` chứa criterion.
- `--migrate [stdin { "checks": { "<checkId>": { "criterionIds": [...], "inputs": [...] } } }]`: chỉ cho task active legacy v1/v2 chưa kết thúc và không blocked. Giữ nguyên status, checkpoint, criteria, mọi field nền của required check và evidence cũ; bỏ token `@task-contract` khỏi `inputs`; append đúng evidence `task-schema-to-v3` với `recordedAt` = `updatedAt` = clock. `criterionIds` (v1) và `inputs` (khi rỗng sau khi bỏ token) không suy đoán: lấy từ `checks` trong stdin, thiếu thì từ chối và liệt kê check còn thiếu. Check non-required thiếu field thì dùng mảng rỗng nếu validator v3 cho phép. Task đã v3, completed, cancelled, blocked bị từ chối.
- `--run-check <id> -- <exe> [args...] [--summary <text>]`: chụp digest, chạy tiến trình bằng process runner inject được (executable + mảng đối số, không shell), chụp lại digest. Bằng nhau: ghi evidence (exit 0 = pass, khác 0 = fail, `summary` mặc định `<exe> — exit <code>`). Lệch: không ghi, báo lỗi. Kết quả `{id,status,checkpoint,updatedAt,evidenceId,result,exitCode,outputTail}`; `outputTail` tối đa 2000 ký tự cuối, không lưu vào task.
- `--brief` cho `--save|--transition|--evidence|--criterion|--migrate|--finish`: `{id,status,checkpoint,updatedAt}` (kèm `evidenceId` khi có); không `--brief` thì output y như hiện tại.

## Tiêu chí chấp nhận

Xem `task.json`.

- ac-evidence-flags — **Verifies:** chk-transport-focused (evidence-flags.test.ts, workflow-command.test.ts).
- ac-criterion-met — **Verifies:** chk-transport-focused (criterion.test.ts).
- ac-brief-output — **Verifies:** chk-transport-focused (brief.test.ts, workflow-command.test.ts).
- ac-run-check — **Verifies:** chk-transport-focused (run-check.test.ts).
- ac-migrate-to-v3 — **Verifies:** chk-transport-focused (migrate-v3.test.ts).
- ac-contract-docs-schema — **Verifies:** chk-transport-focused (schema test, docs contract test).
- Toàn bộ — **Verifies:** chk-full-suite.

## Rủi ro

- `cli-program.ts` đã sát ngưỡng độ phức tạp: tách wiring workflow sang `src/commands/workflow-command.ts`, không đổi hành vi (golden snapshot không được regenerate).
- `--run-check` chạy tiến trình do agent chỉ định: không dùng shell, output không lưu, timeout mặc định 30 phút.
- Digest tự tính có thể khác digest "trước" mà agent đã chụp: `--digest` cho phép truyền digest trước, guard save so với digest hiện tại.
