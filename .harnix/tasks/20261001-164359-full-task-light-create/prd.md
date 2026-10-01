# PRD - Tao Full task nhe (bo guard artifacts luc create)

## Van de
save.ts:147 bat buoc envelope --save co artifacts khi tao Full task -> agent phai nhoi prd/plan JSON lon luc tao (friction lap lai moi Full task, de hong khi pipe pwsh). Ready gate DA chan prd/plan tai ready, dung hop dong tai lieu.

## Acceptance
- ac-light-create - Verifies: envelope.test.ts (tao full khong artifacts OK) + ready.test.ts (ready chan khi thieu).
- ac-guidance-light - Verifies: persistence-guidance + skill-sources + doc tay.

## Non-goals
Khong doi ready gate; khong doi hop dong tai lieu; khong doi ghi file/digest.
