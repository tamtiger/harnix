# Them version va dua Project profile len dau trong agents bootstrap template

- **ID:** 20261001-145709-agents-template-version-profile-order
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-01 14:57:09 +07:00
- **Updated:** 2026-10-01 15:04:08 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

renderAgentsTemplate (src/templates/harnix/agents.ts) phai nhung version Harnix vao project AGENTS.md bootstrap, va dua phan Project profile len dau (truoc phan Harnix rules). Version lay tu caller (update.ts truyen packageVersion); them field version? vao AgentsProjectProfile de giu structural callers hien co. Cap nhat cac test dang assert thu tu rules-truoc-profile.

## Non-goals

- Khong doi noi dung Harnix rules
- Khong doi cach version-sync hoat dong
- Khong doi template nen tang khac (chi project bootstrap AGENTS.md)

## Acceptance criteria

- `ac-version-profile` (met): renderAgentsTemplate xuat version Harnix (vd 2.0.0-dev.9) va dat block Project profile TRUOC block Harnix rules; update.ts truyen packageVersion; cac test templates/init/activation/budget pass voi thu tu moi.

## Required checks

- `chk-agents` (focused): Test agents template + init bootstrap + activation + budget — pass (2026-10-01 15:02:19 +07:00)
- `chk-suite` (full): Project suite gate lint typecheck test — pass (2026-10-01 15:03:54 +07:00)

## Evidence

- `chk-agents` — pass (2026-10-01 15:02:19 +07:00): pnpm — exit 0
- `chk-suite` — pass (2026-10-01 15:03:54 +07:00): pwsh — exit 0
