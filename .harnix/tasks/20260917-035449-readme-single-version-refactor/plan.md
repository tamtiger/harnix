# Plan — README: mot version duy nhat o dau trang, refactor lai noi dung

## Checklist trien khai

- [x] `SLICE-1` — Doi contract version-sync sang mot marker (RED truoc, GREEN sau).
- [x] `SLICE-2` — Viet lai README (badge version, muc luc, bullet Trang thai, xoa 2 cho nhac version cu).
- [x] `SLICE-3` — Chay version:sync that + full acceptance, xac nhan khong regression.

### Slice `SLICE-1`

Sua `replaceReadmeVersion` trong `scripts/version-sync.mjs` de chi con mot regex pattern; cap nhat fixture/assertion trong `test/unit/version-sync.test.ts` cho khop. Viet RED truoc (test moi mong doi mot marker), quan sat fail dung ly do, roi sua toi thieu de GREEN.

Criteria: `ac-2`, `ac-3`
Checks: `chk-version-sync-unit`
Paths: `scripts/version-sync.mjs`, `test/unit/version-sync.test.ts`

### Slice `SLICE-2`

Them dong "**Version:** `x.y.z`" ngay sau H1; them "## Muc luc" voi link toi moi H2; viet lai "Trang thai" thanh bullet; xoa hai cho nhac version cu trong "Trang thai" va "Workflow su dung", thay bang tham chieu ve dong version dau trang; cap nhat prose "hai current-version claim" thanh "mot" trong phan "Dong bo version release".

Criteria: `ac-1`, `ac-4`
Checks: `chk-readme-structure`
Paths: `README.md`

### Slice `SLICE-3`

Rebuild, chay `pnpm version:sync <version-moi> --summary ...` that de xac nhan contract moi hoat dong end-to-end tren chinh README that; chay lint/typecheck/build/full acceptance suite (loai tru file `.kilo` pre-existing da biet).

Criteria: `ac-5`
Checks: `chk-acceptance`, `chk-version-sync-e2e`
Paths: `README.md`, `package.json`, `CHANGELOG.md`
