# Một lệnh chạy mọi check bắt buộc và tóm tắt kết quả

- **ID:** 20261006-202544-run-all-checks
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-07 10:59:20 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Agent không phải gọi --run-check lần lượt cho từng check: một lệnh chạy các check bắt buộc còn pending hoặc stale theo thứ tự (focused trước, suite cuối), ghi evidence như --run-check, dừng ở lần fail đầu và in tóm tắt rất ngắn.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): harnix workflow --run-checks chạy tuần tự mọi required check còn pending hoặc stale bằng đúng command và cwd đã khai báo, focused trước và check suite sau cùng, ghi evidence như --run-check và dừng ở check đầu tiên fail.
- `ac-2` (met): Output là một đối tượng ngắn chỉ gồm id, result, exitCode của từng check đã chạy và check còn lại; không in output của lệnh khi pass.
- `ac-3` (met): Check đang ở circuit breaker stop hoặc không có command khiến lệnh dừng với lý do nêu rõ, không chạy gì.
- `ac-4` (met): Cookbook và skill harnix-verify ghi lệnh này như đường chính ở giai đoạn verify.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 10:58:25 +07:00)
- `check-runchecks` (focused): Test lõi và cờ --run-checks: thứ tự, dừng ở fail, output ngắn, từ chối khi breaker hoặc thiếu command — pass (2026-10-07 10:58:58 +07:00)
- `check-gates` (focused): Contract tests (cli-contract, docs, skill sources, instruction budget, golden) xanh sau khi thêm lệnh và sửa tài liệu — pass (2026-10-07 10:59:02 +07:00)

## Decisions

- **d-failed-reruns** — --run-checks chạy cả check có bằng chứng mới nhất là fail (ngoài pending và stale) vì sau khi sửa lỗi thì đó là đường lặp chính; circuit breaker vẫn chặn lần chạy thứ ba.
  - _Why:_ Nếu chỉ chạy pending/stale thì sau một lần đỏ agent phải quay lại --run-check từng check, làm mất mục đích của lệnh.

## Evidence

- skipped (2026-10-07 10:52:50 +07:00): Task contract revised at persisted replan: Test tích hợp CLI của --run-checks phải nằm ở test/integration/commands/workflow-handlers.test.ts để khớp cấu trúc mirror src/commands
- `check-runchecks` — pass (2026-10-07 10:58:58 +07:00): pnpm exec vitest run test/unit/core/workflow/run-checks.test.ts test/unit/core/workflow/command-match.test.ts test/integration/commands/workflow-flags.test.ts test/integration/commands/workflow-han... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-gates` — pass (2026-10-07 10:59:02 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-07 10:58:25 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
