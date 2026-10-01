# Giam token lang phi: gop loi validate --save, bo sung chi dan save va cookbook

- **ID:** 20261001-155543-reduce-token-waste-save-guidance
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-01 15:55:43 +07:00
- **Updated:** 2026-10-01 16:18:12 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Giam token lang phi khi chay Harnix tren moi repo/tool bang 3 cai tien: (1) validateTask gop nhieu loi doc lap thanh mot thong bao thay vi throw loi dau tien; (2) skill harnix-plan liet ke day du rang buoc --save va dan doc --schema truoc; (3) Command cookbook workflow.md them mau --save, compound --run-check, guarded replan.

## Non-goals

- Khong doi rang buoc schema - chi doi CACH bao loi
- Khong doi noi dung tung thong bao loi hien co
- Khong dong 9 rule always-loaded

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-aggregate-errors` (met): validateTask tren envelope v3 co nhieu loi doc lap throw mot TaskValidationError chua tat ca thong bao; moi thong bao con lai la substring nen test toThrow substring van pass; envelope hop le van pass.
- `ac-plan-save-constraints` (met): Skill harnix-plan liet ke day du rang buoc --save va dan doc harnix workflow --schema mot lan truoc khi dung envelope.
- `ac-cookbook-save` (met): Command cookbook workflow.md co mau --save toi thieu, compound --run-check qua shell, va guarded replan.

## Required checks

- `chk-validate` (focused): Test validator gop loi — pass (2026-10-01 16:16:09 +07:00)
- `chk-guidance` (focused): Test skill plan + cookbook — pass (2026-10-01 16:16:24 +07:00)
- `chk-suite` (full): Project suite gate — pass (2026-10-01 16:17:39 +07:00)

## Decisions

- **d-validate-aggregate** — validateTask gom loi theo nhom doc lap: structural core (asTaskObject/topLevelKeys/identity/arrays) van throw ngay vi downstream cast phu thuoc; nhom shape doc lap (validationPlan/evidence/criteria/uniqueness-paths) chay trong collectValidationErrors (try/catch, thu TaskValidationError, re-throw loi khac) roi throw mot lan noi bang '; '. Giu nguyen van tung message nen moi test .toThrow(substring) hien co van pass. Giam so lan resend envelope --save.
  - _Why:_ Nguon ton token lon nhat la --save fail-fast tung loi mot; gop loi de sua 1 lan.

## Evidence

- `chk-validate` — pass (2026-10-01 16:16:09 +07:00): pnpm — exit 0
- `chk-guidance` — pass (2026-10-01 16:16:24 +07:00): pnpm — exit 0
- `chk-suite` — pass (2026-10-01 16:17:39 +07:00): pwsh — exit 0
