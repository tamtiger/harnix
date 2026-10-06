# Cô lập digest của từng check khỏi định nghĩa các check khác

- **ID:** 20261006-141320-per-check-digest-isolation
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 14:13:30 +07:00
- **Updated:** 2026-10-06 16:55:31 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

inputDigest của một check chỉ phụ thuộc vào input files, định nghĩa của chính check đó và tiêu chí nó phủ, để --replace-check hoặc --set-check trên check khác không làm stale bằng chứng pass hợp lệ.

## Non-goals

- Không làm yếu việc phát hiện thay đổi input hay định nghĩa của chính check
- Không viết lại hoặc xóa evidence cũ

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Digest của check X không đổi khi chỉ định nghĩa của check khác hoặc tiêu chí mà X không phủ thay đổi (--replace-check, --set-check, --add-criterion trên phần không liên quan); bằng chứng pass của X vẫn fresh qua status, --criterion, suite gate và finish.
- `ac-2` (met): Digest của check X đổi khi đổi command, inputs, cwd, scope, required, description hoặc criterionIds của chính X, text của một tiêu chí X phủ, mode của task, hoặc nội dung file input.
- `ac-3` (met): Evidence pass ghi bằng công thức digest cũ (toàn bộ hợp đồng task) của task chưa finish vẫn được nhận fresh khi hợp đồng task chưa đổi kể từ lúc ghi, không giả pass và không buộc chạy lại; evidence mới ghi bằng công thức mới; có test cho cả hai.
- `ac-4` (met): Mọi nơi so một digest đã ghi với digest hiện tại (check-report, assertNewEvidenceDigests, assertInputDigestsFresh, criterion, suite-gate) dùng chung một hàm so khớp; --snapshot không lộ digest công thức cũ và vẫn giữ khóa taskContractHash, nay là hash hợp đồng của riêng check đó.
- `ac-5` (met): workflow.md, AGENTS.md, các docs hợp đồng đóng băng và skill harnix-verify mô tả đúng thành phần của digest (chỉ định nghĩa của chính check, tiêu chí nó phủ, mode, file input) và việc vẫn nhận digest công thức cũ; test parity tài liệu và golden được cập nhật có chủ đích.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-06 16:54:43 +07:00)
- `check-digest` (focused): Test digest theo từng check, nhận digest cũ, và mọi chỗ so khớp digest — pass (2026-10-06 16:55:29 +07:00)
- `check-docs` (focused): Tài liệu mô tả đúng thành phần của digest — pass (2026-10-06 16:48:12 +07:00)

## Decisions

- **per-check-contract** — Hợp đồng của một check gồm id task, mode, định nghĩa của chính check và id cùng text các tiêu chí nó phủ; digest công thức cũ vẫn được nhận qua một hàm so khớp duy nhất.
  - _Why:_ Tránh stale bằng chứng hợp lệ khi thao tác obligation trên check khác, mà không bắt task đang chạy phải chạy lại.

## Residual risks

- **digest-formula-change-retry-guard** (low) — Công thức digest đổi nên lần chạy thất bại đầu tiên sau nâng cấp không bị coi là giống hệt lần thất bại trước theo digest; breaker chỉ so các lần chạy sau nâng cấp.

## Evidence

- `check-digest` — pass (2026-10-06 16:55:29 +07:00): pnpm exec vitest run test/unit/core/verification test/unit/core/workflow test/unit/core/tasks test/integration/commands/checks.test.ts test/integration/commands/status.test.ts test/workflow/task-co... — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-docs` — pass (2026-10-06 16:48:12 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts test/workflow/skill-sources.test.ts test/workflow/instruction-budget.test.ts — exit 0
- `check-suite` — pass (2026-10-06 16:54:43 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
