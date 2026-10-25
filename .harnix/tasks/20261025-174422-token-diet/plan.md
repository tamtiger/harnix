# Plan: Tối ưu token

## Execution Slices

- [x] [chk-schema] ac-1: `briefWorkflowEnvelopeSchema` bỏ `transports`, thêm `transportsOmitted`; action `schema` nhận `--brief`/`--full`; `--schema --full` in đủ
- [x] [chk-gates] ac-1: golden chỉ thêm `--schema` vào `constraints.brief`; cli-contract xanh
- [x] [chk-tokens] ac-2: reference `cookbook-commands` chỉ giữ dạng lệnh hiếm và chi tiết; sheet bỏ `--evidence`, `--set-baseline`, `--transition verifying/finishing`
- [x] [chk-tokens] ac-3: rút gọn `harnix-plan/SKILL.md` xuống ≤ 1.800 token; `SKILL_BUDGET` trong instruction-budget hạ xuống 1.800
- [x] [chk-tokens] ac-4: `sessionLiteTokens` trong `scripts/measure-tokens.mjs`, trường `sessionLite` trong báo cáo
- [x] [check-suite] lint, typecheck, toàn bộ test; `pnpm version:sync 2.22.0-dev.4`; `pnpm selfhost:sync`; docs (HARNIX_WORKFLOW, reference agent-transport)

## Guardrails & Invariants

- Không bỏ nội dung bắt buộc: mọi câu bị cắt khỏi sheet còn ở reference hoặc `--schema --full`.
- Trần ngân sách trong test chỉ được hạ, không nới.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1 | chk-schema, chk-gates |
| ac-2 | chk-tokens, chk-gates |
| ac-3, ac-4 | chk-tokens |
| tất cả | check-suite |
