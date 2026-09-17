# README: mot version duy nhat o dau trang, refactor lai noi dung

- **ID:** 20260917-035449-readme-single-version-refactor
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-17T03:58:21.849Z
- **Updated:** 2026-09-17T04:06:01.256Z

## Goal

README.md chi hien thi version o dung mot cho ngay dau trang (ngay duoi H1), xoa cac cho nhac lai version rai rac giua bai, va lam gon lai cau truc/prose ma khong doi y nghia ky thuat. scripts/version-sync.mjs va test cua no phai dong bo theo dung mot marker version thay vi hai.

## Non-goals

- Khong doi noi dung ky thuat/hanh vi cua tung command trong phan CLI (chi doi cau truc/trinh bay, khong doi fact).
- Khong doi CHANGELOG.md hay cach quan ly version cua no.
- Khong them badge npm/CI dong (khong co registry that de trai vao).
- Khong doi cac file docs/ khac ngoai README.md.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): README.md hien thi dung mot chuoi version, ngay duoi tieu de H1, va khong con chuoi version nao khac lap lai giua bai (tru CHANGELOG.md khong bi dong).
- `ac-2` (met): scripts/version-sync.mjs chi con quan ly dung mot managed version-claim pattern trong README.md (khong con hai pattern nhu truoc); prose trong README mo ta dung 'mot' claim, khong con 'hai'.
- `ac-3` (met): test/unit/version-sync.test.ts duoc cap nhat theo dung contract moi (mot marker) va toan bo suite lien quan pass.
- `ac-4` (met): README duoc bo sung muc luc (Muc luc) sau dong version va phan 'Trang thai' duoc viet lai thanh bullet ro rang, giu nguyen moi fact hien co, khong xoa hay bop meo thong tin.
- `ac-5` (met): pnpm version:sync chay end-to-end thanh cong voi contract moi (bump version that, ghi dung mot vi tri trong README), lint/typecheck/build/test:acceptance (tru phan .kilo pre-existing da biet) deu xanh.

## Required checks

- `chk-version-sync-unit` (focused): Chay test unit cho version-sync voi contract mot marker moi. — pass (2026-09-17T04:05:43.892Z)
- `chk-readme-structure` (focused): Kiem tra README chi co dung mot chuoi version va co muc luc. — pass (2026-09-17T04:05:43.892Z)
- `chk-acceptance` (full): Chay lint, typecheck, build va full acceptance suite (loai tru file bi anh huong boi worktree ngoai pham vi da biet truoc). — pass (2026-09-17T04:05:43.892Z)
- `chk-version-sync-e2e` (full): Chay pnpm version:sync that (bump version) va xac nhan README chi doi dung mot vi tri. — pass (2026-09-17T04:05:43.892Z)

## Decisions

- **dec-1** — Phan loai Full thay vi Lite.
  - _Why:_ Thay doi dong thoi mot documented/tested contract (so managed version marker trong README) o ca script tooling va test, khong con la 'docs-only prose'; theo dung rule routing cua chinh Harnix (doi frozen contract khong duoc mac dinh Lite).
- **dec-2** — Badge version dat ngay sau H1, dang '**Version:** `x.y.z`', tach rieng khoi cau chuyen 'chua publish npm' (van giu o Trang thai).
  - _Why:_ Nguoi dung yeu cau 'mot cho ngay dau trang'; tach version so khoi narrative status giup mot vi tri duy nhat de quet mat, con status van giai thich ngu canh.
- **dec-3** — Pham vi refactor noi dung: gioi han o Muc luc moi va viet lai bullet cho 'Trang thai'; giu nguyen cau truc H2/H3 va noi dung ky thuat cua cac phan CLI/platform khac.
  - _Why:_ Yeu cau 'refactor lai noi dung' khong neu chi tiet; rewrite toan bo 500 dong ky thuat da duoc kiem chung se tang rui ro sai lech fact ma khong co tin hieu ro rang can thiet. Bounded scope duoc neu ro trong bao cao cho nguoi dung, khong am tham thu hep.

## Evidence

- `chk-version-sync-unit` — pass (2026-09-17T04:05:43.892Z): 3/3 test version-sync.test.ts pass voi contract mot marker moi (RED da quan sat truoc do voi ly do dung: thieu managed current-version claim).
- `chk-readme-structure` — pass (2026-09-17T04:05:43.892Z): README chi con dung 1 chuoi version (1.1.5) va co muc Muc luc voi 17 lien ket khop dung 17/18 heading con lai.
- `chk-acceptance` — pass (2026-09-17T04:05:43.892Z): lint/typecheck/build sach; 587/588 test pass (1 skip tu truoc), 75 file, loai tru dung test/unit/package-contract.test.ts (pre-existing .kilo worktree, khong lien quan task nay).
- `chk-version-sync-e2e` — pass (2026-09-17T04:05:43.892Z): Da chay that node scripts/version-sync.mjs 1.1.5 --summary ...; ket qua changed:true, cap nhat dung 1 vi tri version trong README.md cung package.json/CHANGELOG.md/skill metadata/self-host manifest; state hien tai on dinh, snapshot truoc/sau khop.
