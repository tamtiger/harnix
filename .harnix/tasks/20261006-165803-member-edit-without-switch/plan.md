# Kế hoạch: --task cho các lệnh sửa

## Checklist

- [x] Slice 1 — `target-task.ts`, nối vào `activeV3`, `batchWorkflow`, `saveWorkflow` (ac-1, ac-3)
- [x] Slice 2 — Flag `--task`, chủ sở hữu flag, thông báo từ chối, handler (ac-1, ac-2)
- [x] Slice 3 — Tài liệu: epic reference, template, docs (ac-4)
- [x] Slice 4 — Phiên bản dev, golden/CLI contract, self-host, verify

## Chi tiết

Slice 1: `src/core/workflow/target-task.ts` (`withTargetTask`, `targetTaskId`, `resolveEditableTask`), `plan-edit.ts`, `batch.ts`, `save.ts` (task đích đóng vai active trong `saveWorkflowLocked`, không ghi `.active`); test `test/unit/core/workflow/target-task.test.ts`. Slice 2: `src/commands/workflow-flags.ts`, `workflow-command.ts`, `workflow-handlers.ts`; `test/workflow/cli-contract.test.ts` cập nhật danh sách option. Slice 3: `src/skills/harnix-plan/references/epic.md`, `src/templates/harnix/workflow.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `test/workflow/docs-task-contract.test.ts` (RED trước). Slice 4: `pnpm version:sync 2.2.0-dev.10`, `pnpm selfhost:sync`, golden có chủ đích, build, lint, typecheck, check focused, `check-suite`, finish. Không commit; không prettier trên markdown.
