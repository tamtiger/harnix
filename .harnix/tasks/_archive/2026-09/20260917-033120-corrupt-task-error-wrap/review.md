# Boc loi ro rang khi task.json bi corrupt thay vi SyntaxError tho

- **ID:** 20260917-033120-corrupt-task-error-wrap
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-09-17T03:31:20.645Z
- **Updated:** 2026-09-17T03:42:22.166Z

## Goal

Khi .harnix/tasks/<id>/task.json bi corrupt hoac truncated, resolveActiveTask/loadTask phai fail closed voi mot TaskValidationError co ten file, thay vi de lo mot JSON.parse SyntaxError tho khong co ngu canh.

## Non-goals

- Khong doi hanh vi khi task.json hop le hoac khi .active trong/thieu (ENOENT).
- Khong doi cach CLI in loi ra ngoai (van la stderr + exit code khac 0).
- Khong sua cac defect khac phat hien trong dot audit nay.

## Acceptance criteria

- `ac-1` (met): task.json bi corrupt/truncated khien resolveActiveTask/loadTask nem TaskValidationError chua duong dan file, thay vi SyntaxError tho.
- `ac-2` (met): Hanh vi hien tai cho task hop le, ENOENT va toan bo test suite hien co khong doi (khong regression).

## Required checks

- `chk-unit` (focused): Chay unit test moi cho corrupt task.json va cac test task-state hien co. — pass (2026-09-17T03:42:08.056Z)
- `chk-acceptance` (full): Chay full acceptance suite de xac nhan khong regression. — pass (2026-09-17T03:42:08.056Z)

## Decisions

- **dec-1** — Phan loai Lite thay vi Full.
  - _Why:_ Thay doi khoanh vung trong mot ham (loadTask), khong doi contract cong khai, khong anh huong cross-layer; ceremony Full se khong tuong xung voi rui ro thuc te.
- **dec-2** — Bug nay duoc tim thay boi Prompt 4 (docs/prompts/workflow-repeat-run-fix.md) khi chay S-25 (corrupt task.json) trong fixture co lap.
  - _Why:_ Ghi lai nguon goc de review sau nay khong phai doan lai tu dau.

## Evidence

- skipped (2026-09-17T03:39:57.683Z): Task contract revised at persisted replan: Lenh goc pnpm run test:acceptance dang fail vi mot git worktree ngoai pham vi (.kilo/worktrees/swift-wildebeest, khong lien quan toi fix nay, khong duoc .gitignore theo doi) lam vo test/unit/package-contract.test.ts. Thay chk-acceptance bang lenh vitest tuong duong nhung loai tru dung file bi anh huong boi artifact ngoai pham vi do; da xac nhan bang git stash rang failure nay ton tai ca khi khong co thay doi cua task nay.
- `chk-unit` — pass (2026-09-17T03:42:08.056Z): 24/24 test task-state.test.ts pass, bao gom test moi cho corrupt task.json. Snapshot truoc/sau khop.
- `chk-acceptance` — pass (2026-09-17T03:42:08.056Z): 587/588 test pass (1 skipped tu truoc), 75 file, loai tru dung 1 file bi anh huong boi .kilo worktree ngoai pham vi (da xac nhan bang git stash la pre-existing, khong lien quan fix nay). Lint va typecheck sach.
