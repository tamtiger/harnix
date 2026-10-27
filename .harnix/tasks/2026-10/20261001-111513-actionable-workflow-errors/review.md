# Thong bao loi workflow actionable de agent repo khac khong lap lai

- **ID:** 20261001-111513-actionable-workflow-errors
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-01 11:15:13 +07:00
- **Updated:** 2026-10-01 11:33:30 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Lam cho thong bao loi va chi dan cua harnix workflow du actionable de coding agent o repo khac khong lap lai cac loi da gap: (1) transition sai state khong biet dich hop le; (2) hieu nham project-level suite check thanh scope=project; (3) ghi evidence thu cong roi chay lenh cham inputs sau do dan den stale digest luc finish. Khong doi hanh vi state machine, chi doi noi dung message va skill guidance.

## Non-goals

- Khong doi state machine transitions hay legalCheckpoints
- Khong doi cach tinh inputDigest hay dieu kien freshness
- Khong doi schema TaskRecord

## Acceptance criteria

- `ac-transition-msg` (met): Loi transition sai liet ke cac dich hop le tu trang thai hien tai (status ke tiep va checkpoint hop le).
- `ac-suite-msg` (met): Message suite-gate ready va finish khong con khien hieu nham scope=project: noi ro can mot required check co inputs phu source va test (vd wildcard **) va scope la focused hoac full.
- `ac-stale-msg` (met): Message stale input digest neu ro nguyen nhan va cach sua: chay lai bang --run-check va khong chay lenh cham inputs giua luc ghi evidence va --finish.
- `ac-skill-guidance` (met): Skill harnix-verify evidence reference ghi ro: dung --run-check cho required check; khong mutate inputs giua ghi evidence va finish; chay check rong truoc check hep.

## Required checks

- `chk-focused` (focused): Test don vi cho message transition suite-gate stale va validate — pass (2026-10-01 11:30:53 +07:00)
- `chk-suite` (full): Project suite gate lint typecheck test — pass (2026-10-01 11:32:29 +07:00)

## Decisions

- **d-stale-ordering** — Loi stale digest luc finish gan nhu luon do: ghi evidence thu cong (--evidence) cho check roi chay them lenh cham inputs (build sinh bin/obj, formatter, sua code) truoc --finish. Finish tinh lai digest -> mismatch. Phong tranh: dung --run-check cho required check (ghi digest nguyen tu), va chay check rong (build full) TRUOC check hep de khong lam cu evidence truoc do; khong chay lenh cham inputs giua ghi evidence va finish.
  - _Why:_ Phan tich log agent payment-hub: build full chay sau khi da ghi evidence test -> stale. Da nho hoa message + skill de agent repo khac khong lap lai.

## Evidence

- `chk-focused` — pass (2026-10-01 11:30:53 +07:00): pnpm — exit 0
- `chk-suite` — pass (2026-10-01 11:32:29 +07:00): pwsh — exit 0
