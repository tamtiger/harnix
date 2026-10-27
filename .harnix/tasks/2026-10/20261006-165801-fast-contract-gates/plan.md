# Kế hoạch: cổng hợp đồng chạy nhanh

## Checklist

- [x] Slice 1 — Guard golden: `changedPaths`, `addedErrorPaths` trong behavior-snapshot (ac-3)
- [x] Slice 2 — `scripts/test-failures.mjs`, script `test:failures` (ac-4)
- [x] Slice 3 — Script `test:gates` và test package-contract (ac-1)
- [x] Slice 4 — Hướng dẫn kế hoạch trong skill và template (ac-2)
- [x] Slice 5 — Phiên bản dev, đồng bộ self-host, build, verify

## Chi tiết

Slice 1: `test/workflow/behavior-snapshot.test.ts`, RED bằng test so sánh hai snapshot nhỏ rồi cài hàm. Slice 2: `scripts/test-failures.mjs`, `test/workflow/test-failures.test.ts`. Slice 3: `package.json`, `test/workflow/package-contract.test.ts`. Slice 4: `src/skills/harnix-plan/SKILL.md`, `src/templates/harnix/workflow.md`, AGENTS.md, `test/workflow/docs-task-contract.test.ts` (RED trước). Slice 5: `pnpm version:sync 2.2.0-dev.8`, `pnpm selfhost:sync`, `pnpm build`, lint, typecheck, check focused, `check-suite`, finish. Không commit; không chạy prettier trên markdown.
