# Cho phép chứng minh bằng check tập trung khi baseline đỏ và đổi check ở verify không ép replan đầy đủ

- **ID:** 20261006-141321-baseline-red-verify-flow
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 14:13:30 +07:00
- **Updated:** 2026-10-06 18:20:32 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Khi suite đã đỏ từ trước ngoài phạm vi task, người dùng có đường ghi nhận baseline đỏ có ủy quyền cùng check chứng minh tập trung, và thay check ở giai đoạn verifying quay lại verifying thay vì đi lại ready, in_progress, verifying, finishing.

## Non-goals

- Không tự động bỏ qua test đỏ mới do chính task gây ra
- Không làm yếu cổng suite mặc định khi baseline xanh

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Có flag ghi baseline của check (result, classification, authorizedBy, scope) mà không cần JSON, và finish/verify báo rõ suite đỏ sẵn đã được ủy quyền.
- `ac-2` (met): Một check suite đỏ sẵn đã có baseline ủy quyền có thể đi kèm check tập trung bắt buộc làm bằng chứng chứng minh deliverable; ready và finish chấp nhận tổ hợp này và vẫn chặn khi không có ủy quyền.
- `ac-3` (met): --replace-check hoặc --set-check khi task ở verifying đưa task về verifying/verifying nếu các check đã pass còn nguyên, thay vì replan; có test cho đường này.
- `ac-4` (met): Quyết định về so sánh delta (chỉ fail test mới) được ghi lại, kèm lý do chọn hoặc không chọn.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 18:20:21 +07:00)
- `check-baseline-flag` (focused): Flag ghi baseline, hiển thị ở status/finish, không cần replan — pass (2026-10-06 18:16:27 +07:00)
- `check-baseline-gate` (focused): Finish chấp nhận suite đỏ sẵn có ủy quyền cùng check focused; vẫn chặn khi thiếu — pass (2026-10-06 18:16:33 +07:00)
- `check-verify-edit` (focused): Đổi check ở verifying quay về verifying/verifying khi pass còn nguyên — pass (2026-10-06 18:16:38 +07:00)
- `check-docs` (focused): Tài liệu và template ghi quyết định delta, baseline và đường verify — pass (2026-10-06 18:16:42 +07:00)

## Decisions

- **baseline-red-authorized-focused-proof** — Khi suite đỏ sẵn ngoài phạm vi task, dùng baseline có ủy quyền của check suite (mở rộng check.baseline hiện có: result, classification, authorizedBy, scope) cùng một check focused bắt buộc làm bằng chứng cho deliverable; không so sánh delta test.
  - _Why:_ Mở rộng cơ chế đã có, giữ cổng suite mặc định khi baseline xanh và cần ủy quyền rõ ràng của người dùng; so sánh delta phải định danh từng test, phức tạp và dễ báo sai.

## Residual risks

- **baseline-needs-focused-proof** (low) — Check suite đỏ sẵn chỉ được finish chấp nhận khi có check required khác (không baseline) pass tươi phủ cùng criterion; thiếu check focused thì cổng suite mặc định vẫn chặn.

## Evidence

- `check-baseline-flag` — pass (2026-10-06 18:16:27 +07:00): pnpm exec vitest run test/unit/core/workflow/baseline.test.ts test/integration/commands/workflow-flags.test.ts — exit 0
- `check-baseline-gate` — pass (2026-10-06 18:16:33 +07:00): pnpm exec vitest run test/unit/core/workflow/suite-gate.test.ts test/unit/core/workflow/completion.test.ts test/unit/core/workflow/finish.test.ts — exit 0
- `check-verify-edit` — pass (2026-10-06 18:16:38 +07:00): pnpm exec vitest run test/unit/core/workflow/plan-edit.test.ts test/unit/core/workflow/replace-check.test.ts — exit 0
- `check-docs` — pass (2026-10-06 18:16:42 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0
- `check-suite` — pass (2026-10-06 18:20:21 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
