# Bat buoc user review truoc khi chay task Full hoac Epic

- **ID:** 20261003-230709-user-review-gate-full-epic
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-03 23:07:09 +07:00
- **Updated:** 2026-10-03 23:15:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Bao dam moi task Full hoac Epic deu dung o ready (checkpoint await) de nguoi dung review ke hoach truoc khi chuyen sang in_progress.

## Non-goals

- Khong thay doi hanh vi tu dong chuyen sang implementing cua task Lite khi yeu cau da ro
- Khong them tuong tac blocking hay popup ngoai giao dien chat chuan

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-workflow-invariants` (met): HARNIX_WORKFLOW.md Invariant 4 va muc 5.3 Ready gate phan tach ro Lite vs Full/Epic; Full va Epic bat buoc dung o ready/await de user review ke hoach truoc khi code.
- `ac-workflow-template` (met): src/templates/harnix/workflow.md va .harnix/workflow.md phan anh quy dinh Full tasks va Epics dung o ready cho user review.
- `ac-skills-guidance` (met): harnix-plan/SKILL.md va epic.md quy dinh ro diem dung await tai ready cho Full task va Epic, yeu cau xuat trinh tom tat ke hoach/lo trinh va cho approval truoc khi implement.
- `ac-agent-rules` (met): AGENTS.md nhat quan voi quy tac mandatory review stop cho Full tasks va Epics.
- `ac-test-suite` (met): Toan bo test suite va instruction token budget vuot qua 100%.

## Required checks

- `check-workflow-docs` (focused): Kiem tra tinh nhat quan cua tai lieu workflow va hop dong task — pass (2026-10-03 23:11:22 +07:00)
- `check-skills-budget` (focused): Kiem tra instruction token budgets va ky nang harnix-plan — pass (2026-10-03 23:11:30 +07:00)
- `check-suite` (full): Chay test suite toan du an — pass (2026-10-03 23:13:58 +07:00)

## Decisions

- **dec-full-epic-review-gate** — Bat buoc dung o ready/await de user review ke hoach cho Full task va Epic
  - _Why:_ Tranh viec Agent tu dong sua code dien rong khi nguoi dung chua kip xem PRD va Plan
- **dec-lite-frictionless** — Giu nguyen co che tu dong implementing cho Lite task khi prompt da ro
  - _Why:_ Toi uu toc do va khong tao ma sat thua cho cac thay doi nho

## Residual risks

- **rsk-user-turn-delay** (low) — User can xac nhan sau plan lam tang 1 turn tuong tac nhung dam bao an toan tuyet doi

## Evidence

- `check-workflow-docs` — pass (2026-10-03 23:11:22 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-skills-budget` — pass (2026-10-03 23:11:30 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-03 23:13:58 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
