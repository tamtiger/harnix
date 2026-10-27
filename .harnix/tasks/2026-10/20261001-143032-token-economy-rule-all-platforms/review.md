# Them Rule 10 token economy vao HARNIX_RULES cho moi nen tang

- **ID:** 20261001-143032-token-economy-rule-all-platforms
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-01 14:30:32 +07:00
- **Updated:** 2026-10-01 14:35:08 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Them Rule 10 (token economy) vao HARNIX_RULES trong src/templates/harnix/activation.ts de moi nen tang (Kiro, Antigravity, Codex, Claude, OpenCode, Cursor) deu nhan huong dan tiet kiem token qua block instruction sinh tu nguon duy nhat. Noi dung: luon --brief; dung status --explain thay --inspect; --run-check thay vi chay tay + --evidence; chay lenh hep khi lap, suite day du 1 lan o verify; tail output va jmespath cho MCP; nap skill reference theo yeu cau. Giu block trong ngan sach 1500 token.

## Non-goals

- Khong doi 9 rule hien co ve noi dung
- Khong tu chay harnix update --global (de nguoi dung tu chay)
- Khong doi logic workflow/state machine

## Acceptance criteria

- `ac-rule10` (met): HARNIX_RULES co Rule 10 token economy (brief, status --explain, run-check, narrow-then-suite, tail+jmespath, lazy skill); renderHarnixRules in ra 10 rule; block always-loaded van trong ngan sach 1500 token (instruction-budget test pass).

## Required checks

- `chk-activation` (focused): Test activation rules + instruction budget — pass (2026-10-01 14:33:32 +07:00)
- `chk-suite` (full): Project suite gate lint typecheck test — pass (2026-10-01 14:34:45 +07:00)

## Decisions

- **d-rule-single-source** — HARNIX_RULES trong src/templates/harnix/activation.ts la nguon duy nhat sinh instruction block cho moi nen tang (Kiro steering, Codex AGENTS.md, Claude CLAUDE.md, Antigravity rules, OpenCode AGENTS.md). Them 1 rule o day ap cho tat ca tool sau khi chay harnix setup/update --global. File Kiro viet tay ~/.kiro/steering/harnix.md la BAN RIENG cua user, khong dong bo tu dong voi package.
  - _Why:_ Giai thich vi sao sua activation.ts moi ap cho moi tool, con sua file Kiro steering chi anh huong Kiro.

## Evidence

- `chk-activation` — pass (2026-10-01 14:33:32 +07:00): pnpm — exit 0
- `chk-suite` — pass (2026-10-01 14:34:45 +07:00): pwsh — exit 0
