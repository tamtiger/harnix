# Gom các ma sát vặt của workflow: đường dẫn có khoảng trắng, định dạng learning, inspect --task, sửa criterion, resume epic

- **ID:** 20261007-132300-workflow-friction-batch
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-07 13:23:00 +07:00
- **Updated:** 2026-10-07 15:28:09 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Sửa một lượt các ma sát nhỏ gặp trong lúc phát triển epic tự cải tiến mà chưa có chỗ xử lý: command có đường dẫn khoảng trắng, định dạng khối learning, đọc task khác bằng --inspect --task, sửa nội dung criterion khi còn planning, resume task kế tiếp của epic và danh sách nơi phải sửa khi thêm action.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Việc so khớp command khai báo với argv của --run-check và --run-checks so executable theo tên (bỏ thư mục và đuôi .exe/.cmd) khi command khai báo là tên trần, và so các đối số theo từng phần tử đúng chuỗi, nên đường dẫn tuyệt đối tới node (kể cả thư mục có khoảng trắng) khớp command khai báo bằng tên; command khai báo có thư mục vẫn phải khớp đúng đường dẫn; có test cho sameCommand và --run-check, và measure-tokens dùng process.execPath được.
- `ac-2` (met): Khối Project learning trong hook context bắt đầu ở dòng mới, không dính vào câu cuối của frame untrusted; có test khóa định dạng và không đổi nội dung hay giới hạn 5 note.
- `ac-3` (met): workflow --inspect --task <task-id> đọc (chỉ đọc) được một task chưa terminal khác mà không đổi con trỏ active, nên không cần đọc thẳng task.json.
- `ac-4` (met): Có cách sửa nội dung một criterion bằng cờ (--set-criterion <id> --text <text>) khi task còn planning; sau planning cần --reason và đi qua replan có kiểm soát; criterion đã có evidence ghi nhận vẫn bất biến; có test và cookbook.
- `ac-5` (met): harnix resume --epic <epic-id> khôi phục task kế tiếp (nextTask) của epic, từ chối khi đang có task active khác hoặc epic không còn task chưa kết thúc; có test cli-contract và docs.
- `ac-6` (met): Có một danh sách ngắn trong docs hoặc test/README nêu mọi nơi phải cập nhật khi thêm cờ hoặc action workflow (flags, brief, schema, cli-contract, index.test, handlers test, golden), và danh sách này được kiểm bằng một test để không lỗi thời.

## Required checks

- `check-1` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 15:27:40 +07:00)
- `check-command` (focused): Test sameCommand theo từ, executable theo tên và --run-check với đường dẫn tuyệt đối — pass (2026-10-07 15:26:03 +07:00)
- `check-text` (focused): Test xuống dòng của learning, inspect --task và --set-criterion — pass (2026-10-07 15:26:09 +07:00)
- `check-resume` (focused): Test resume --epic: task kế tiếp, từ chối khi có task active khác hoặc epic hết việc — pass (2026-10-07 15:26:14 +07:00)
- `check-checklist` (focused): Test danh sách nơi phải sửa khi thêm cờ hoặc action không lỗi thời — pass (2026-10-07 15:26:16 +07:00)
- `check-gates` (focused): Contract tests (cli-contract, schema, golden, docs, instruction budget) xanh sau khi thêm --set-criterion, resume --epic và sửa tài liệu — pass (2026-10-07 15:26:20 +07:00)

## Decisions

- **d-excluded** — Không đưa vào task này: sửa check sau ready không phải đi vòng replan (hệ quả của việc đóng băng obligations) và cài lại CLI trên PATH (cần người dùng cho phép).
  - _Why:_ Hai mục này đổi hợp đồng đóng băng hoặc cần quyền người dùng, không thuộc nhóm ma sát vặt.
- **d-basename-match** — sameCommand chỉ so executable theo tên khi command khai báo là tên trần (không có thư mục); command khai báo có thư mục phải khớp đúng đường dẫn đã chuẩn hóa.
  - _Why:_ Nguyên nhân thật của lỗi measure-tokens là đường dẫn tuyệt đối khác tên trần (không phụ thuộc khoảng trắng), nên ac-1 đã viết lại; so theo tên làm lỏng nhẹ ràng buộc argv bằng command khai báo nên giữ nghiêm với command có thư mục.

## Residual risks

- **r-duplicate-secret-patterns** (low) — Bộ mẫu secret nằm ở ba nơi (secret-scan.ts, learning-safety.ts, scripts/scan-secrets.mjs); sửa một nơi dễ quên hai nơi còn lại. Cần gom về một module chung khi có cách đóng gói cho scripts.
- **r-test-line-caps** (low) — Một số file test sát trần 400 dòng (finish.test.ts 399, workflow-flags.test.ts 384): thêm test mới vào đó sẽ vi phạm test-structure, nên đặt test mới vào file mới đúng mirror.
- **r-no-planning-edit-guard** (low) — Harnix không chặn sửa file sản phẩm khi task còn planning; quy tắc chỉ dựa vào kỷ luật của agent. Một cảnh báo cần so sánh digest hoặc dùng Git nên ngoài phạm vi task này.

## Evidence

- `check-command` — pass (2026-10-07 15:26:03 +07:00): pnpm exec vitest run test/unit/core/workflow/command-match.test.ts test/unit/core/workflow/run-check.test.ts test/workflow/measure-tokens.test.ts — exit 0
- `check-text` — pass (2026-10-07 15:26:09 +07:00): pnpm exec vitest run test/workflow/learning-automation.test.ts test/unit/core/workflow/set-criterion.test.ts test/integration/commands/workflow-handlers.test.ts — exit 0
- `check-resume` — pass (2026-10-07 15:26:14 +07:00): pnpm exec vitest run test/integration/commands/resume.test.ts — exit 0
- `check-checklist` — pass (2026-10-07 15:26:16 +07:00): pnpm exec vitest run test/workflow/action-checklist.test.ts — exit 0
- `check-gates` — pass (2026-10-07 15:26:20 +07:00): pnpm test:gates — exit 0
- `check-1` — pass (2026-10-07 15:27:40 +07:00): pnpm test — exit 0
