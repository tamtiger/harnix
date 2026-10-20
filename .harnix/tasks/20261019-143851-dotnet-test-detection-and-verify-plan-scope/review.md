# Nhận diện test project .NET và lọc phạm vi verify-plan

- **ID:** 20261019-143851-dotnet-test-detection-and-verify-plan-scope
- **Mode:** full
- **Epic:** 20261019-143847-field-defects-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-19 14:38:47 +07:00
- **Updated:** 2026-10-19 15:47:56 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Chỉ coi project .NET là có test khi thực sự có test runner, gom theo solution, và cho verify-plan lọc theo đường dẫn, thay đổi Git hoặc đầu ra gọn.

## Non-goals

- Không mutate Git; --changed chỉ đọc.
- Không đổi schema config.yaml.

## Relevant paths

- `README.md`
- `src/cli-workflow-commands.ts`
- `src/commands/verify-plan.ts`
- `src/core/stack/dotnet-projects.ts`
- `src/core/stack/verify-detection.ts`
- `src/core/stack/verify-plan.ts`
- `src/core/stack/workspace-detection.ts`
- `src/templates/harnix/workflow.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Project .NET chỉ có hasTests true khi .csproj, .fsproj hoặc .vbproj chứa Microsoft.NET.Test.Sdk, IsTestProject true hoặc PackageReference tới xunit, nunit, mstest; class library như Domain hay Application.Contracts có hasTests false và không có commands.test.
- [x] `ac-2` (met): Thư mục chứa .sln là một package với lệnh dotnet test <tên>.sln; các project mà solution tham chiếu không còn là package riêng kể cả khi dùng verify-plan --recursive; csproj độc lập không thuộc solution vẫn là package.
- [x] `ac-3` (met): harnix verify-plan hỗ trợ --path <dir>, --changed (package có file thay đổi theo git status, chỉ đọc) và --brief (chỉ package có test, mỗi package chỉ giữ path, hasTests, commands.test); đầu ra mặc định giữ nguyên cấu trúc.
- [x] `ac-4` (met): Toàn bộ test suite của dự án pass.

## Required checks

- [x] `chk-focus` (focused): Test phát hiện .NET, gom solution và cờ lọc verify-plan — pass (2026-10-19 15:46:36 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-19 15:47:49 +07:00)
- [x] `chk-gates` (focused): Contract tests (test:gates) và bộ test của dự án phải xanh — pass (2026-10-19 15:46:40 +07:00)

## Decisions

- **dec-1** — Logic xác định csproj là test project và gom theo .sln đặt trong một helper dùng chung với task phát hiện package không có package.json.
  - _Why:_ Hai task cùng chạm phát hiện .NET ở hai hệ khác nhau (workspace-detection.ts và detection.ts); helper chung tránh hai định nghĩa lệch nhau.

## Evidence

- `chk-focus` — pass (2026-10-19 15:46:36 +07:00): pnpm exec vitest run test/unit/core/stack test/unit/commands/verify-plan.test.ts test/integration/commands/verify-plan.test.ts — exit 0
- `chk-gates` — pass (2026-10-19 15:46:40 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-19 15:47:49 +07:00): pnpm test — exit 0
