# Phát hiện package không có package.json (C#, PHP, Java, Go...) khi ghi config.yaml

- **ID:** 20261019-144907-detect-non-npm-packages-for-config
- **Mode:** full
- **Epic:** 20261019-143847-field-defects-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-19 14:49:07 +07:00
- **Updated:** 2026-10-19 16:44:23 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Làm detectPackages nhận diện package theo mọi loại manifest (.sln/.csproj, composer.json, pom.xml, go.mod, Cargo.toml, pyproject.toml), gom .NET theo solution, để packages trong config.yaml phản ánh đủ các service backend thay vì chỉ các thư mục có package.json.

## Relevant paths

- `src/core/stack/detection.ts`
- `src/core/stack/dotnet-projects.ts`
- `src/core/stack/package-roots.ts`
- `test/unit/core/stack/detection.test.ts`
- `test/unit/core/stack/package-roots.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): detectPackages nhận diện package từ .sln, .csproj/.fsproj/.vbproj, composer.json, pom.xml, build.gradle, go.mod, Cargo.toml và pyproject.toml, không chỉ package.json; repo đa dịch vụ C# được ghi đủ từng service với languages và technologies đúng (csharp, dotnet, abp).
- [x] `ac-2` (met): .NET được gom theo thư mục solution (không sinh mỗi csproj một package); project mà solution tham chiếu không là package riêng; csproj độc lập không thuộc solution vẫn là package.
- [x] `ac-3` (met): Test hồi quy dựng đúng cấu trúc payment-hub (frontend npm cộng nhiều service C#) cho đủ mọi package; package có package.json giữ nguyên kết quả cũ; repo không có thư mục package nào vẫn dùng fallbackPackage.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-19 16:44:16 +07:00)
- [x] `chk-focus` (focused): chk-focus — pass (2026-10-19 16:43:03 +07:00)

## Decisions

- **dec-1** — Dùng chung helper phát hiện .NET (test project, gom theo .sln) với task dotnet-test-detection-and-verify-plan-scope và chạy ngay sau task đó.
  - _Why:_ Catalog đã nhận csharp, dotnet, abp từ .csproj; lỗi chỉ ở detectPackages chỉ duyệt package.json.

## Evidence

- `chk-focus` — pass (2026-10-19 16:43:03 +07:00): pnpm exec vitest run test/unit/core/stack test/integration/commands/init.test.ts — exit 0
- `check-suite` — pass (2026-10-19 16:44:16 +07:00): pnpm test — exit 0
