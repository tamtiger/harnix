# Goi 1: Lam robust ready-trace parser, modularize internal-workflow, va scaffold roadmap members

- **ID:** 20260925-103500-ready-trace-robustness
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-25T03:53:25.454Z
- **Updated:** 2026-09-25T04:23:27.052Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Cải tiến parser ready-trace không bị kén ký tự dash, tách nhỏ module internal-workflow.ts, và hỗ trợ roadmapMembers trong save envelope.

## Non-goals

- Không thay đổi frozen schema contracts của TaskRecord.
- Không làm gián đoạn các task đã hoàn thành.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-all-tests-green` (met): Full test suite, build, typecheck, lint pass cleanly
- `ac-parser-dash-flexibility` (met): ready-trace parser accepts -, en-dash, and em-dash in checklist
- `ac-parser-unit-tests` (met): Unit tests cover diverse dash characters in checklist
- `ac-roadmap-member-scaffolding` (met): Save envelope supports roadmapMembers to scaffold all planned epic tasks
- `ac-workflow-module-split` (met): Helper logic cleanly extracted from internal-workflow.ts

## Required checks

- `check-build-and-tests` (focused): Verify full build, typecheck, lint and tests — pass (2026-09-25T04:23:14.620Z)
- `check-module-split` (focused): Verify internal-workflow modular extraction — pass (2026-09-25T04:23:14.620Z)
- `check-parser-code` (focused): Check ready-trace.ts supports -, en-dash, and em-dash — pass (2026-09-25T04:23:14.620Z)
- `check-parser-tests` (focused): Run ready-trace unit tests — pass (2026-09-25T04:23:14.620Z)
- `check-roadmap-scaffold` (focused): Verify roadmapMembers support in save envelope and roadmap markdown sync — pass (2026-09-25T04:23:14.620Z)

## Decisions

- **d-regex-dash** — Support [-–—] in checklist regex
  - _Why:_ Avoid fragile failures caused by editor auto-formatting or varied markdown conventions
- **d-extract-workflow-helpers** — Extract workflow envelope and snapshot helpers
  - _Why:_ Keep command file focused on CLI routing and action handling
- **d-roadmap-members-save** — Support roadmapMembers in save envelope
  - _Why:_ Allow single-command scaffolding of all planned member tasks when initializing an epic

## Evidence

- `check-build-and-tests` — pass (2026-09-25T04:23:14.620Z): pnpm build && pnpm typecheck && pnpm lint && pnpm test:unit passed cleanly
- `check-module-split` — pass (2026-09-25T04:23:14.620Z): Extracted workflow helpers to src/core/tasks/workflow-helpers.ts
- `check-parser-code` — pass (2026-09-25T04:23:14.620Z): Updated regex to [-–—] in ready-trace.ts
- `check-parser-tests` — pass (2026-09-25T04:23:14.620Z): vitest run test/workflow/ready-trace.test.ts passed
- `check-roadmap-scaffold` — pass (2026-09-25T04:23:14.620Z): vitest run test/workflow/internal-workflow-save.test.ts passed
