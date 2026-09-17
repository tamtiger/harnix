# Dong bo routeWorkflow() voi carve-out Bypass docs-only/literal-value moi

- **ID:** 20260917-064027-route-workflow-bypass-sync
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-09-17T06:40:27.224Z
- **Updated:** 2026-09-17T06:44:28.236Z

## Goal

src/core/workflow.ts's routeWorkflow() la pure reference model duoc test/workflow/routing.test.ts va history-regressions.test.ts pin, nhung chua phan anh carve-out Bypass moi (docs-only edit, bounded literal-value edit) da them vao prose o task truoc. Mo rong type WorkflowRouteFacts.mutation va logic routeWorkflow() de dong bo, kem test moi.

## Non-goals

- Khong doi bat ky command CLI nao trong src/commands/ - da xac nhan routeWorkflow() khong duoc goi boi runtime nao.
- Khong doi cac nhanh logic hien co cho mutation 'none'/'task-artifact'/'project'.
- Khong doi workKind, action hay cac risk signal khac ngoai viec dung 'contract-change' va 'material-unknown' lam safety valve.

## Acceptance criteria

- `ac-1` (met): WorkflowRouteFacts.mutation them hai gia tri moi 'docs-only' va 'literal-value'.
- `ac-2` (met): routeWorkflow() tra ve entry bypass voi reason code 'docs-only-bypass'/'literal-value-bypass' cho hai mutation moi khi khong co risk signal 'contract-change' hoac 'material-unknown'; khi co mot trong hai signal do, request duoc xu ly nhu mutation 'project' binh thuong (Lite/Full theo risk).
- `ac-3` (met): Bypass tu hai mutation moi giu active task khong doi (bo qua truoc khi vao routeActiveTask), giong cach cac Bypass khac (review/research/inspect) hien dang hoat dong.
- `ac-4` (met): test/workflow/routing.test.ts co it nhat 4 test case moi: docs-only bypass, literal-value bypass, docs-only + contract-change khong bypass (van Lite/Full theo risk), va bypass giu active task nguyen ven; toan bo 24 assertion cu van pass khong doi.

## Required checks

- `chk-routing-unit` (focused): Chay test/workflow/routing.test.ts va history-regressions.test.ts voi mutation type moi. — pass (2026-09-17T06:44:15.195Z)
- `chk-acceptance` (full): Chay lint, typecheck, build va full acceptance suite (loai tru file bi anh huong boi worktree ngoai pham vi da biet truoc). — pass (2026-09-17T06:44:15.195Z)

## Decisions

- **dec-1** — Phan loai Lite.
  - _Why:_ Localized o dung 2 file (mot core module, mot test file), khong doi contract be ngoai (workflow.md/skill khong doi), khong cross-layer.
- **dec-2** — Khi risk signal buoc tracked, remap request sang mutation 'project' ngay dau ham thay vi sua rai rac nhieu nhanh ben duoi.
  - _Why:_ Giu thay doi toi thieu, tan dung toan bo logic Lite/Full/active-task hien co ma khong phai doi tung nhanh rieng le cho hai gia tri mutation moi.
- **dec-3** — Dung dung hai risk signal co san 'contract-change' va 'material-unknown' lam safety valve, khong them risk signal moi.
  - _Why:_ Khop chinh xac wording prose da viet: 'unless it changes a frozen public contract or embeds a material product decision' - hai khai niem nay da co san dinh nghia trong enum WorkflowRiskSignal.

## Evidence

- `chk-routing-unit` — pass (2026-09-17T06:44:15.195Z): 31/31 test routing.test.ts + history-regressions.test.ts pass, gom 5 assertion moi cho docs-only/literal-value bypass va safety valve; 24 assertion cu khong doi.
- `chk-acceptance` — pass (2026-09-17T06:44:15.195Z): lint/typecheck/build sach; 588/589 test pass (1 skip tu truoc), 75 file, loai tru dung test/unit/package-contract.test.ts (pre-existing .kilo worktree, khong lien quan task nay).
