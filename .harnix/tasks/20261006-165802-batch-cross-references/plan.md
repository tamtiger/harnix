# Kế hoạch: tham chiếu chéo trong --batch

## Checklist

- [x] Slice 1 — Test hồi quy hai chiều tham chiếu và lỗi gộp (RED), `assertBatchReferences` (GREEN) (ac-1, ac-2, ac-3)
- [x] Slice 2 — Cookbook ghi batch không phụ thuộc thứ tự (ac-4)
- [x] Slice 3 — Phiên bản dev, đồng bộ self-host, build, verify

## Chi tiết

Slice 1: `src/core/workflow/batch-apply.ts`, `src/core/workflow/batch.ts`, `test/unit/core/workflow/batch.test.ts`. Slice 2: `src/templates/harnix/workflow.md`, `test/workflow/docs-task-contract.test.ts` (RED trước). Slice 3: `pnpm version:sync 2.2.0-dev.9`, `pnpm selfhost:sync`, build, lint, typecheck, check focused, `check-suite`, finish. Không commit; không prettier trên markdown.
