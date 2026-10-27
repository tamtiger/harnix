# Đóng các đường xanh giả của check và evidence

- **ID:** 20261005-184126-dong-xanh-gia-run-check
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 18:41:25 +07:00
- **Updated:** 2026-10-05 20:00:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Chặn mọi đường ghi pass không chứng minh gì: argv lệch command, suite gate chỉ xét inputs, timestamp tương lai, cwd thoát repo, race finish/cancel, breaker chỉ tư vấn (R-002, R-003, R-005, R-006, R-009, R-034).

## Non-goals

- Không đổi enum, exit code hay tên field khác ngoài những gì §4 được cập nhật cùng thay đổi
- Không tự thêm cơ chế chạy shell

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): `workflow --run-check <id> -- <argv>` từ chối (không ghi evidence) khi argv, sau chuẩn hóa (bỏ dấu nháy, gộp khoảng trắng, coi `pnpm test`, `pnpm run test`, `npm test`, `npm run test`, `yarn test` là tương đương), khác `command` đã khai báo của check; evidence ghi lại lệnh thật đã chạy (cắt 200 ký tự); check không có `command` vẫn chạy được.
- `ac-2` (met): Suite gate (ready và finishing) yêu cầu `command` của check suite khớp một lệnh test do `buildVerifyPlan` trả về (gốc hoặc package), không trỏ tới một file test cụ thể; có test với `pnpm vitest run test/x.test.ts` bị từ chối ở cả hai cổng, và giữ hành vi cũ khi `verify-plan` không có lệnh test xác định.
- `ac-3` (met): Evidence có `recordedAt` lớn hơn đồng hồ hiện tại bị từ chối ở mọi transport (`--save`, `--evidence`, `--batch`); chuỗi pass-tương-lai rồi fail thật không thể `--finish`.
- `ac-4` (met): `cwd` của check được chuẩn hóa về đường dẫn tương đối POSIX trong repo, kiểm bằng realpath lúc save và lúc chạy; `--run-check --cwd` khác `cwd` đã khai báo bị từ chối; `cwd` nằm trong `canonicalCheck`/so sánh frozen.
- `ac-5` (met): `--finish` và `--cancel` chạy dưới project lock và đọc lại task trong lock; test chèn một evidence fail giữa assert và save thì finish thất bại thay vì ghi đè.
- `ac-6` (met): Circuit breaker có hiệu lực cho schema v3: khi disposition là `stop`, `--run-check` và `--evidence` bị từ chối với thông báo dừng và báo cáo; lối đi duy nhất là `--replace-check --reason` và replacement không được trùng hệt check bị thay (phải khác `command`, `inputs` hoặc `cwd`).
- `ac-7` (met): Hợp đồng `cwd` và `baseline` của `ValidationCheck` được ghi vào `docs/IMPLEMENTATION_PLAN.md` §4 và PRD với allowlist key lồng nhau cho `baseline`, hoặc bị gỡ; schema, validator, `--schema` và docs thống nhất (quyết định mặc định đề xuất: chính thức hóa).
- `ac-8` (met): Cổng chất lượng xanh: `pnpm run typecheck`, `pnpm run lint` và `pnpm run test` (có coverage, không hạ ngưỡng) đều exit 0 trên cây mã cuối cùng của task.

## Required checks

- `check-workflow` (focused): Test core, utils và workflow cho run-check, suite gate, evidence, finish, cancel, breaker — pass (2026-10-05 19:58:10 +07:00)
- `check-cwd` (focused): Test cwd an toàn và digest — pass (2026-10-05 19:58:16 +07:00)
- `check-contract` (focused): Test hợp đồng task v3 và tài liệu — pass (2026-10-05 19:58:21 +07:00)
- `check-typecheck` (full): pnpm run typecheck exit 0 — pass (2026-10-05 19:58:27 +07:00)
- `check-lint` (full): pnpm run lint (format:check + ESLint) exit 0 — pass (2026-10-05 19:58:50 +07:00)
- `check-suite` (full): pnpm run test (vitest + coverage) exit 0 — pass (2026-10-05 19:59:44 +07:00)

## Decisions

- **d-golden-schema-text** — Golden snapshot được sinh lại đúng một lần vì chữ mô tả của workflow --schema đổi có chủ ý; diff chỉ gồm 4 dòng thêm và 2 dòng đổi của schema.
  - _Why:_ Hành vi runtime không đổi, chỉ mô tả --run-check, --replace-check và hai ràng buộc checkCwd, checkBaseline; đã xem diff trước khi giữ lại.
- **d-suite-command-rule** — Suite gate yêu cầu command của check suite khớp lệnh test của verify-plan (gốc hoặc package), coi npm, pnpm, yarn, bun là tương đương; không có lệnh test xác định thì chỉ xét inputs.
  - _Why:_ Chỉ xét hình dạng inputs đã để một check chạy một file test lọt cổng ở bản 2.0.4.

## Residual risks

- **r-run-check-cwd-flag** (low) — Cookbook cũ cho phép --run-check --cwd tuỳ ý; nay cờ này chỉ được lặp lại cwd đã khai báo, nên script cũ dùng --cwd cho check chưa khai báo cwd sẽ bị từ chối.
- **r-breaker-needs-user-path** (medium) — Sau hai fail liên tiếp chỉ --replace-check với bản khác command, inputs hoặc cwd mới đi tiếp; chưa có cách chạy lại cùng check sau khi người dùng cho phép sửa mã.
- **r-replace-check-overlap-task4** (low) — replace-check nay kế thừa command của check bị thay, nên một phần tiêu chí của task toan-ven-state-machine đã được làm sẵn ở đây.

## Evidence

- `check-workflow` — pass (2026-10-05 19:58:10 +07:00): pnpm vitest run test/unit/core test/unit/utils test/workflow — exit 0
- `check-cwd` — pass (2026-10-05 19:58:16 +07:00): pnpm vitest run test/unit/core/workflow/run-check.test.ts test/unit/utils/check-runner.test.ts — exit 0
- `check-contract` — pass (2026-10-05 19:58:21 +07:00): pnpm vitest run test/workflow/task-contract-v3.test.ts test/workflow/docs-task-contract.test.ts — exit 0
- `check-typecheck` — pass (2026-10-05 19:58:27 +07:00): pnpm typecheck — exit 0
- `check-lint` — pass (2026-10-05 19:58:50 +07:00): pnpm lint — exit 0
- `check-suite` — pass (2026-10-05 19:59:44 +07:00): pnpm test — exit 0
