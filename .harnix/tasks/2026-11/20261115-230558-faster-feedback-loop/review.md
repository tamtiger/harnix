# Rút ngắn vòng phản hồi implement và verify của Harnix

- **ID:** 20261115-230558-faster-feedback-loop
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-11-15 23:05:58 +07:00
- **Updated:** 2026-11-16 10:36:55 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | r-narrow-inputs: medium, r-frozen-evidence: medium |

## Goal

Giảm thời gian và số lần chạy lại suite trong vòng implement đến verify: bắt lỗi rẻ (lint, typecheck, complexity) sớm hơn suite có coverage, tránh làm bằng chứng suite hết hạn không cần thiết.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/HARNIX_WORKFLOW.md` | modified | +4 / -0 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/tasks/task-schema.ts` | modified | +3 / -1 |
| `src/core/tasks/task-validate.ts` | modified | +2 / -0 |
| `src/core/workflow/check-order.ts` | added | - |
| `src/core/workflow/evidence-flags.ts` | modified | +3 / -0 |
| `src/core/workflow/init-default-inputs.ts` | added | - |
| `src/core/workflow/init-task.ts` | modified | +2 / -1 |
| `src/core/workflow/run-check.ts` | modified | +9 / -0 |
| `src/core/workflow/run-checks.ts` | modified | +19 / -7 |
| `src/core/workflow/schema.ts` | modified | +3 / -3 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/integration/commands/workflow-handlers.test.ts` | modified | +1 / -1 |
| `test/integration/scenarios/cli-real-process.test.ts` | modified | +2 / -2 |
| `test/unit/core/tasks/task-validate-contracts.test.ts` | modified | +23 / -0 |
| `test/unit/core/workflow/check-order.test.ts` | added | - |
| `test/unit/core/workflow/init-default-inputs.test.ts` | added | - |
| `test/unit/core/workflow/run-check.test.ts` | modified | +16 / -0 |
| `test/unit/core/workflow/run-checks.test.ts` | modified | +3 / -3 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +4 / -3 |

## Acceptance criteria

- [x] `ac-1` (met): workflow --run-check và --run-checks báo thời lượng (durationMs) của mỗi check đã chạy, cả pass lẫn fail; evidence ghi thêm field tùy chọn durationMs.
- [x] `ac-2` (met): workflow --run-checks chạy check ngắn trước trong cùng scope theo thời lượng ghi nhận gần nhất (chưa có thì giữ thứ tự khai báo), vẫn focused trước full và dừng ở check fail đầu tiên.
- [x] `ac-3` (met): workflow --init: khi dự án có cả cây mã nguồn và cây test, input mặc định của check-suite là hai cây đó cộng file manifest ở gốc, nên sửa tài liệu không làm bằng chứng suite hết hạn; ngược lại giữ **, và vẫn qua suite gate.
- [x] `ac-4` (met): Cờ, field và hành vi mới được đồng bộ ở schema, golden, tài liệu và template workflow, trong trần token hiện có.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-15 23:34:29 +07:00)
- [x] `chk-timing` (focused): Thời lượng, thứ tự chạy và input mặc định — pass (2026-11-15 23:28:16 +07:00)
- [x] `chk-gates` (focused): Hợp đồng CLI, schema, golden và tài liệu — pass (2026-11-15 23:32:18 +07:00)

## Decisions

- **d-duration-field** — Thời lượng lưu bằng field tùy chọn durationMs trên evidence
  - _Why:_ Cần nhớ thời lượng lần chạy trước để sắp xếp; field tùy chọn cộng thêm không phá evidence cũ. Phương án thay thế chỉ báo ra output thì không sắp xếp được theo lịch sử
- **d-order-within-scope** — Chỉ sắp xếp theo thời lượng bên trong cùng scope; focused vẫn trước full
  - _Why:_ Giữ nguyên hợp đồng thứ tự hiện tại; check chưa có thời lượng giữ thứ tự khai báo nên hành vi cũ không đổi
- **d-default-inputs** — Input mặc định thu hẹp chỉ khi có cả cây mã nguồn và cây test
  - _Why:_ Suite gate chấp nhận wildcard hoặc cây nguồn cộng cây test; thu hẹp để docs không làm suite hết hạn, và cộng manifest ở gốc để đổi phụ thuộc vẫn làm hết hạn

## Residual risks

- **r-narrow-inputs** (medium) — Input hẹp bỏ sót file ngoài src và test ảnh hưởng kết quả test (cấu hình, fixture ở thư mục khác) (Mitigation: Cộng manifest và file cấu hình ở gốc; dự án có cấu trúc khác vẫn dùng ** và người dùng đổi bằng --input)
- **r-frozen-evidence** (medium) — Thêm field vào evidence chạm hợp đồng đóng băng của TaskRecord v3 (Mitigation: Field tùy chọn, bỏ qua khi đọc evidence cũ, cập nhật validator, tài liệu và test migration)

## Evidence

- `chk-timing` — pass (2026-11-15 23:28:16 +07:00): pnpm exec vitest run test/unit/core/workflow test/unit/utils test/unit/core/tasks — exit 0
- `chk-gates` — pass (2026-11-15 23:32:18 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-15 23:34:29 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
