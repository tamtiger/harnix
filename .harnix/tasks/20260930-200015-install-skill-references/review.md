# Cài đặt reference files trực tiếp vào global skill setup và cập nhật đường dẫn tương đối

- **ID:** 20260930-200015-install-skill-references
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-09-30 20:00:15 +07:00
- **Updated:** 2026-09-30 20:11:43 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Cài đặt các file reference cùng thư mục kỹ năng tại skills/<name>/references/<topic>.md qua setup global, cập nhật SKILL.md trỏ đường dẫn tương đối, và bổ sung 1 dòng bảo vệ contract criterion bất biến vào workflow.md

## Non-goals

- Không đưa nội dung reference trực tiếp vào SKILL.md chính (giữ ngân sách token)
- Không bỏ CLI command harnix skill --reference (giữ tương thích ngược)

## Acceptance criteria

- `ac-install-references` (met): globalSkillDesiredFiles xuất ra cả 6 SKILL.md và 7 reference files tại skills/<name>/references/<topic>.md với sourceId phân biệt
- `ac-skill-relative-paths` (met): Các file SKILL.md (plan, implement, verify) trỏ reference bằng đường dẫn tương đối ./references/<topic>.md
- `ac-workflow-contract-immutability` (met): workflow.md template chứa quy tắc bất biến của contract criterion mapped by evidence
- `ac-suite-pass` (met): Toàn bộ test suite unit, workflow, platform và instruction-budget pass 100%

## Required checks

- `check-global-surface` (focused): Kiểm tra globalSkillDesiredFiles xuất đủ skill và reference files — pass (2026-09-30 20:07:05 +07:00)
- `check-instruction-budget` (focused): Kiểm tra ngân sách token và source integrity của skills — pass (2026-09-30 20:11:32 +07:00)
- `check-suite-gate` (full): Suite gate kiểm tra toàn bộ unit, workflow và platform tests — pass (2026-09-30 20:11:00 +07:00)

## Decisions

- **dec-install-references** — Install reference files directly at skills/<name>/references/<topic>.md alongside SKILL.md so agents can read them locally via relative paths without CLI overhead
  - _Why:_ Reduces reference adoption risk where coding agents skip CLI discovery

## Residual risks

- **risk-uninstall-empty-dirs** (medium) — Deepest-first cleanup is required when uninstalling hierarchical skill directories to avoid leaving parent folders non-empty

## Evidence

- `check-global-surface` — pass (2026-09-30 20:07:05 +07:00): pnpm — exit 0
- `check-instruction-budget` — pass (2026-09-30 20:11:32 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite-gate` — pass (2026-09-30 20:11:00 +07:00): pnpm — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
