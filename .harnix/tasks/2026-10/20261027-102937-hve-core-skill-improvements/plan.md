# Implementation Plan: Áp dụng chọn lọc ý tưởng từ hve-core vào skill harnix

## Execution Slices

### Slice 1: Implementation & Verification
- [ ] [check-suite] Toàn bộ test, lint và typecheck của dự án phải xanh (Lệnh: `pnpm run test`)
- [ ] [chk-skills] Test catalog skill và ngân sách instruction (Lệnh: `pnpm exec vitest run test/unit/skills test/workflow/instruction-budget.test.ts`)
- [ ] [chk-gates] Contract tests (CLI, docs, golden, kiến trúc) (Lệnh: `pnpm run test:gates`)
- [ ] [chk-footprint] Ngân sách footprint của setup (Lệnh: `pnpm run measure:footprint`)
- [ ] [chk-release] Chuỗi nghiệm thu release (Lệnh: `pnpm run release:check`)
- [ ] [chk-suite] Toàn bộ test của dự án (Lệnh: `pnpm run test`)

## Guardrails & Invariants
- Duy trì tính tương thích ngược 100% (Backward Compatibility).
- Tuân thủ các quy ước kiến trúc và giới hạn của dự án (AGENTS.md, .harnix/spec/guides/).

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3, ac-4, ac-5 | check-suite | `pnpm run test` | full |
| ac-1, ac-2, ac-3, ac-4 | chk-skills | `pnpm exec vitest run test/unit/skills test/workflow/instruction-budget.test.ts` | focused |
| ac-4, ac-5 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | chk-footprint | `pnpm run measure:footprint` | focused |
| ac-5 | chk-release | `pnpm run release:check` | full |
| ac-1, ac-2, ac-3, ac-4, ac-5 | chk-suite | `pnpm run test` | full |
