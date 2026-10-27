# Output --run-check chỉ nêu test lỗi thay vì đuôi log dài

- **ID:** 20261006-202545-run-check-failure-summary
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-07 11:19:24 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Khi một check fail, outputTail của --run-check hiện tối đa 2000 ký tự log thô; thay bằng tóm tắt các test lỗi (tên và dòng đầu thông điệp) khi nhận diện được định dạng vitest, và giữ đuôi ngắn cho lệnh khác, để giảm token đọc lỗi.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Khi check fail và output có báo cáo lỗi vitest nhận diện được, outputTail liệt kê tên test lỗi cùng dòng đầu thông điệp, tối đa 10 mục và 800 ký tự.
- `ac-2` (met): Với lệnh khác hoặc output không nhận diện được, outputTail rút còn tối đa 600 ký tự cuối; khi pass không có outputTail.
- `ac-3` (met): outputTail vẫn không được lưu vào task và không lộ đường dẫn tuyệt đối của máy.
- `ac-4` (met): Khi check fail, --run-check --brief và --run-checks --brief vẫn in đuôi ngắn (vài dòng cuối hoặc tóm tắt test lỗi) để biết lý do đỏ; khi pass không in output nào.
- `ac-5` (met): Lỗi môi trường của launcher (pnpm/npm báo không có package.json, lệnh không tồn tại, cwd sai) được báo là lỗi khởi chạy kèm lý do ngắn và không ghi evidence fail, nên không tính vào circuit breaker; test đỏ thật vẫn ghi evidence fail; có test cho cả hai nhánh.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 11:18:55 +07:00)
- `check-summary` (focused): Test tóm tắt output check, nhận diện lỗi launcher và --run-check/--run-checks trả đuôi gọn khi fail — pass (2026-10-07 11:17:50 +07:00)
- `check-cli` (focused): Test CLI: --brief vẫn in đuôi ngắn khi fail, không in gì khi pass — pass (2026-10-07 11:17:58 +07:00)
- `check-gates` (focused): Contract tests (cli-contract, docs, golden, instruction budget) xanh sau khi đổi schema và tài liệu — pass (2026-10-07 11:18:02 +07:00)

## Decisions

- **d-brief-tail** — Hiện --run-checks --brief bỏ outputTail của check fail; góp ý thực tế cho thấy fail không kèm lý do khiến phải chạy lại để đoán nguyên nhân, nên brief phải giữ đuôi ngắn khi fail.
  - _Why:_ Ba lần --run-check --brief fail exit 1 sau khoảng 2 giây không cho biết là test đỏ hay lệnh không khởi chạy được; chạy lại cùng lệnh thì pass.

## Residual risks

- **r-launcher-heuristic** (medium) — Nhận diện lỗi launcher bằng mẫu output có thể báo sai; chỉ coi là lỗi khởi chạy khi khớp mẫu hẹp (ERR_PNPM_NO_PKG_MANIFEST, ENOENT, not recognized) và ngoài ra giữ hành vi ghi fail như cũ.

## Evidence

- `check-summary` — pass (2026-10-07 11:17:50 +07:00): pnpm exec vitest run test/unit/core/workflow/check-output.test.ts test/unit/core/workflow/run-check.test.ts test/unit/core/workflow/run-checks.test.ts — exit 0
- `check-cli` — pass (2026-10-07 11:17:58 +07:00): pnpm exec vitest run test/integration/commands/workflow-command.test.ts test/integration/commands/workflow-handlers.test.ts — exit 0
- `check-gates` — pass (2026-10-07 11:18:02 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-07 11:18:55 +07:00): pnpm test — exit 0
