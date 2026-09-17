# Mo rong Bypass: docs-only edit va bounded literal-value edit khong can tao task

- **ID:** 20260917-062549-bypass-docs-and-trivial-edit
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-17T06:25:49.765Z
- **Updated:** 2026-09-17T06:31:54.881Z

## Goal

Hien tai Harnix bat buoc MOI repository file mutation phai la Lite hoac Full (khong co ngoai le), ke ca sua docs/prompts thuan tuy hoac doi mot literal value don le. Nguoi dung yeu cau: doi voi docs-only edit (bao gom viet/sua prompt duoi docs/) va bounded literal-value-only edit (mot hang so, toi da hai file, khong doi behavior/interface/schema), khong can tao task Harnix - route thanh Bypass. Cap nhat contract nay dong bo o moi noi dinh nghia no.

## Non-goals

- Khong doi state machine cot loi (planning->ready->in_progress->verifying->completed) hay cac gate/transition hien co cho Lite/Full.
- Khong noi long yeu cau task cho bat ky thay doi behavior/interface/schema/security nao, du nho.
- Khong doi docs/HARNIX_PRD.md (frozen product spec o muc truu tuong hon, khong mau thuan voi thay doi nay, de scope nho gon).
- Khong dong bo lai src/core/workflow.ts's routeWorkflow() reference model va test cua no trong task nay - day la mot pure decision-table KHONG duoc goi boi bat ky live CLI command nao (da xac nhan qua grep), chi dung de pin contract cho test. Ghi lai la mot residual gap duoc hoan trong bao cao, khong am tham bo qua.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Bullet Bypass trong src/templates/harnix/workflow.ts liet ke ro: docs-only edit (bao gom viet/sua prompt) va bounded literal-value-only edit deu la Bypass, tru khi doi frozen public contract hoac chua material product decision.
- `ac-2` (met): src/skills/harnix-brainstorm/SKILL.md duoc cap nhat dong bo cung dinh nghia Bypass moi.
- `ac-3` (met): src/templates/harnix/agents.ts (AGENTS.md bootstrap ngan gon) duoc cap nhat tham chieu ngan gon toi carve-out moi, khong vuot byte budget 8192 cua ban rong.
- `ac-4` (met): .harnix/workflow.md va AGENTS.md that cua repo nay duoc dong bo dung wording moi (workflow.md qua harnix update tu template; AGENTS.md hand-sync vi khong duoc self-host manifest quan ly).
- `ac-5` (met): docs/HARNIX_WORKFLOW.md muc 3.1 Bypass duoc cap nhat de khong con documentation-drift so voi contract moi.
- `ac-6` (met): test/workflow/skill-sources.test.ts va test/workflow/templates.test.ts duoc cap nhat theo text moi; lint/typecheck/build/full acceptance suite (tru test/unit/package-contract.test.ts da biet la pre-existing/ngoai pham vi) deu xanh.

## Required checks

- `chk-skill-unit` (focused): Chay test/workflow/skill-sources.test.ts voi text Bypass moi. — pass (2026-09-17T06:31:38.632Z)
- `chk-templates-unit` (focused): Chay test/workflow/templates.test.ts voi text Bypass moi va byte budget AGENTS.md. — pass (2026-09-17T06:31:38.632Z)
- `chk-selfhost-sync` (focused): Xac nhan .harnix/workflow.md va AGENTS.md that cua repo chua dung text Bypass moi. — pass (2026-09-17T06:31:38.632Z)
- `chk-docs-sync` (focused): Xac nhan docs/HARNIX_WORKFLOW.md muc 3.1 da cap nhat. — pass (2026-09-17T06:31:38.632Z)
- `chk-acceptance` (full): Chay lint, typecheck, build va full acceptance suite (loai tru file bi anh huong boi worktree ngoai pham vi da biet truoc). — pass (2026-09-17T06:31:38.632Z)

## Decisions

- **dec-1** — Phan loai Full thay vi Lite.
  - _Why:_ Doi ranh gioi Bypass/Lite/Full - mot frozen public contract - dong thoi tren nhieu file (template, skill, self-hosted docs, docs nguon); cross-layer va anh huong moi consumer project qua harnix init/update.
- **dec-2** — 'Docs-only' giu nguyen y nghia da co (prose/formatting, khong doi executable behavior); chi doi HAU QUA tu 'mac dinh Lite' thanh 'mac dinh Bypass', van giu dung safety valve cu: neu doi frozen public contract hoac chua material product decision thi van la Lite/Full.
  - _Why:_ Giu tinh nhat quan voi khai niem da co, giam rui ro dinh nghia lai tu dau; an toan valve khong doi nen khong mo loophole moi cho cac thay doi thuc su quan trong duoi vo boc 'docs'.
- **dec-3** — Khong dong bo src/core/workflow.ts's routeWorkflow()/test cua no trong task nay.
  - _Why:_ Da xac nhan qua grep: routeWorkflow() khong duoc goi boi bat ky src/commands/* nao - la pure reference model chi ton tai de test pin contract, khong anh huong hanh vi agent thuc te (agent doc prose truc tiep). Dong bo no se doi type 'mutation' va can them nhieu test case moi, vuot pham vi 'bo ceremony cho docs/trivial edit' ma nguoi dung yeu cau. Ghi ro day la residual gap, khong phai bi bo sot.
- **dec-4** — Khong doi docs/HARNIX_PRD.md trong task nay.
  - _Why:_ PRD hien tai mo ta Bypass o muc truu tuong hon, khong truc tiep mau thuan voi thay doi nay (khong liet ke chi tiet 'docs-only mac dinh Lite'); giu scope gon, tranh mo rong sang frozen product spec khong can thiet.

## Evidence

- `chk-skill-unit` — pass (2026-09-17T06:31:38.632Z): 6/6 test skill-sources.test.ts pass voi wording Bypass moi trong harnix-brainstorm.
- `chk-templates-unit` — pass (2026-09-17T06:31:38.632Z): 7/7 test templates.test.ts pass; workflowTemplate va AGENTS.md empty-profile deu chua dung carve-out moi, byte budget 8192 van dat.
- `chk-selfhost-sync` — pass (2026-09-17T06:31:38.632Z): .harnix/workflow.md (regenerate qua harnix update) va AGENTS.md (hand-sync) that cua repo deu chua dung wording moi.
- `chk-docs-sync` — pass (2026-09-17T06:31:38.632Z): docs/HARNIX_WORKFLOW.md muc 3.1 da cap nhat dung carve-out moi.
- `chk-acceptance` — pass (2026-09-17T06:31:38.632Z): lint/typecheck/build sach; 587/588 test pass (1 skip tu truoc), 75 file, loai tru dung test/unit/package-contract.test.ts (pre-existing .kilo worktree, khong lien quan task nay).
