# Kế hoạch: cảnh báo skew và phát hành 2.2.0

## Checklist

- [x] Slice 1 — `src/core/versions/skew.ts` và test ba trường hợp (ac-1, ac-2)
- [x] Slice 2 — Nối vào `--preflight` và `doctor` (ac-1, ac-2)
- [x] Slice 3 — Tài liệu và test CHANGELOG (ac-3, ac-4)
- [x] Slice 4 — Phát hành 2.2.0: version:sync, gom CHANGELOG, self-host, golden, verify

## Chi tiết

Slice 1: `src/core/versions/skew.ts`, `test/unit/core/versions/skew.test.ts`. Slice 2: `src/core/workflow/preflight.ts`, `src/commands/workflow-handlers.ts`, `src/core/doctor/project.ts`, `src/core/doctor/doctor.ts`; test `preflight.test.ts`, `project.test.ts`. Slice 3: `src/templates/harnix/workflow.md`, `AGENTS.md`, `docs/HARNIX_WORKFLOW.md`, `test/workflow/docs-task-contract.test.ts` (RED trước, gồm test CHANGELOG). Slice 4: `pnpm version:sync 2.2.0 --summary "..." --kind added`, gom các entry `2.2.0-dev.N` trong `CHANGELOG.md` thành entry 2.2.0, `pnpm selfhost:sync`, `pnpm build`, golden có chủ đích, lint, typecheck, `pnpm test:failures`, check focused, `check-suite`, finish. Không commit; không prettier trên markdown.
