# Cho phep tao Full task o planning khong can artifacts, ready gate van chan

- **ID:** 20261001-164359-full-task-light-create
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-01 16:43:59 +07:00
- **Updated:** 2026-10-01 16:53:09 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Bo guard tao-task thua o src/core/workflow/save.ts (dong 147) bat buoc envelope --save phai co artifacts khi tao Full task. Guard nay ep agent nhoi prd/plan dang JSON lon ngay luc tao (friction lap lai moi Full task, de hong khi pipe JSON qua pwsh). Ready gate (ready.ts) DA bat buoc prd.md/plan.md khong rong doc tu disk, dung voi hop dong tai lieu (WORKFLOW/PRD/IMPLEMENTATION_PLAN deu noi 'tai ready'). Sau khi bo guard: tao Full task = JSON nho (chi task.json), roi viet prd.md/plan.md bang editor tool; ready gate chan neu thieu. Cap nhat skill harnix-plan + cookbook mo ta luong nhe nay.

## Non-goals

- Khong doi ready gate (van bat buoc prd/plan khong rong + 1 checklist item tai ready)
- Khong doi hop dong tai lieu (chi align code voi tai lieu da noi 'tai ready')
- Khong doi cach ghi file artifacts hay digest

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-light-create` (met): saveWorkflow tao mot Full task planning MA KHONG co artifacts thanh cong (chi ghi task.json); sau do transition ready that bai neu prd.md/plan.md thieu/rong; thanh cong khi da co prd/plan khong rong + checklist item.
- `ac-guidance-light` (met): Skill harnix-plan va Command cookbook mo ta luong tao Full task nhe: --save JSON nho roi viet prd.md/plan.md bang editor tool, ready gate la cho chan.

## Required checks

- `chk-create` (focused): Test tao Full task khong artifacts + ready gate chan — pass (2026-10-01 16:51:22 +07:00)
- `chk-guidance` (focused): Test skill + cookbook guidance — pass (2026-10-01 16:51:26 +07:00)
- `chk-suite` (full): Project suite gate — pass (2026-10-01 16:52:37 +07:00)

## Decisions

- **d-light-full-create** — Guard tao-task save.ts (full && !artifacts -> throw) la thua: ready gate (ready.ts) va cac doc (WORKFLOW/PRD/IMPLEMENTATION_PLAN) deu dinh nghia yeu cau prd/plan 'tai ready', khong phai luc create. Khi envelope khong co artifacts, plannedSaveFiles chi ghi task.json va validateTaskArtifacts chi chay neu co artifacts, nen bo guard la an toan. Giup tao Full task nhe (JSON nho) roi viet prd.md/plan.md bang editor tool, tranh nhoi prose JSON lon.
  - _Why:_ Giam friction lap lai moi Full task; align code voi hop dong tai lieu.

## Evidence

- `chk-create` — pass (2026-10-01 16:51:22 +07:00): pnpm — exit 0
- `chk-guidance` — pass (2026-10-01 16:51:26 +07:00): pnpm — exit 0
- `chk-suite` — pass (2026-10-01 16:52:37 +07:00): pwsh — exit 0
