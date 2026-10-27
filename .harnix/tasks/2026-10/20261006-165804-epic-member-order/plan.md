# Kế hoạch: thứ tự chạy của epic

## Checklist

- [x] Slice 1 — `order` trong `EpicRecord`, `src/core/epics/order.ts`, áp thứ tự cho `harnix epic` và `.md` (ac-1, ac-2)
- [x] Slice 2 — `src/core/workflow/epic-order.ts` và flag `--epic-order` (ac-3)
- [x] Slice 3 — Tài liệu: PRD/workflow/plan, epic reference, template (ac-4)
- [x] Slice 4 — Phiên bản dev, self-host, golden/CLI contract, verify

## Chi tiết

Slice 1: `src/core/epics/epic.ts`, `src/core/epics/order.ts`, `src/commands/epic.ts`; test `test/unit/core/epics/order.test.ts`, `test/unit/core/epics/epic.test.ts`. Slice 2: `src/core/workflow/epic-order.ts`, `index.ts`, `src/commands/internal-workflow.ts`, `workflow-flags.ts`, `workflow-command.ts`, `workflow-handlers.ts`; test `test/unit/core/workflow/epic-order.test.ts`. Slice 3: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `src/skills/harnix-plan/references/epic.md`, `src/templates/harnix/workflow.md`, `test/workflow/docs-task-contract.test.ts` (RED trước). Slice 4: `pnpm version:sync 2.2.0-dev.11`, `pnpm selfhost:sync`, cập nhật cli-contract và golden có chủ đích, build, lint, typecheck, `pnpm test:failures` trước khi ghi check, check focused, `check-suite`, finish. Không commit; không prettier trên markdown.
