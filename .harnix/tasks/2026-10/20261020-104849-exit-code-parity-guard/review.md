# Khóa bằng test việc mã thoát process luôn khớp error.exitCode của JSON

- **ID:** 20261020-104849-exit-code-parity-guard
- **Mode:** lite
- **Epic:** 20261020-104845-workspace-and-gate-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-20 10:48:45 +07:00
- **Updated:** 2026-10-20 11:38:43 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Thêm test hợp đồng bảo đảm với mọi lệnh public lỗi, giá trị trả về của runCli (mã thoát process) bằng error.exitCode trong JSON, và kết luận trung thực về báo cáo exit 1 so với JSON 2 của repo-map.

## Non-goals

- Không đổi ngữ nghĩa mã thoát 1 và 2 đã đóng băng.

## Relevant paths

- `README.md`
- `docs/HARNIX_PRD.md`
- `src/cli-program.ts`
- `test/integration/scenarios/cli-errors.test.ts`

## Artifacts

- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Mở rộng test scenario cli-errors: với mỗi tình huống lỗi công khai (repo-map thiếu cờ, cờ lạ, thiếu project, tham số sai) giá trị trả về của runCli bằng error.exitCode trong JSON stdout và message ở stderr bằng error.message; phạm vi chỉ gồm public error envelope (doctor, setup, uninstall, workflow và context ẩn dùng giao thức riêng nên nằm ngoài).
- [x] `ac-2` (met): Báo cáo repo-map exit 1 so với JSON 2 có nguyên nhân gốc đã xác định: wrapper pnpm harnix.ps1 cùng PowerShell 7 biến stderr thô của native command thành NativeCommandError và ghi đè mã thoát 2 thành 1; Node thoát đúng 2. Ghi vào README và docs/HARNIX_PRD.md mục khắc phục sự cố (đọc error.exitCode trong JSON hoặc chuyển hướng stderr bằng 2>$null), không đổi kênh stderr.
- [x] `ac-3` (met): Toàn bộ test suite của dự án và test:gates pass.

## Required checks

- [x] `chk-focus` (focused): Test parity mã thoát và error.exitCode — pass (2026-10-20 11:36:20 +07:00)
- [x] `chk-gates` (focused): Contract tests: docs, skills, instruction budget, golden — pass (2026-10-20 11:36:24 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite của dự án pass — pass (2026-10-20 11:37:46 +07:00)

## Decisions

- **dec-1** — Báo cáo repo-map exit 1 so với JSON 2 không tái hiện: harnix 2.12.3 trong PowerShell thoát 2 cho repo-map không cờ, cờ lạ và ngoài project.
  - _Why:_ runCli luôn đặt exitCode 2 cho mọi lỗi công khai (cli-program.ts). Mã 1 có thể đến từ lớp bao ngoài (shim pnpm hoặc cmd, công cụ agent gộp mọi mã khác 0 thành 1); cần shell và lệnh chính xác để kết luận.
- **dec-2** — Nguyên nhân exit 1 so với JSON 2 là hành vi PowerShell 7 với stderr, không phải lỗi mã thoát của Harnix; giữ nguyên stderr, chỉ thêm test parity và tài liệu khắc phục sự cố.
  - _Why:_ Agent dựa vào stderr và ngữ nghĩa mã thoát đã đóng băng; Node thoát 2 đúng và chuyển hướng stderr giữ được 2.
- **dec-ver** — Phiên bản 2.13.0-dev.4, kind changed. cli-program.ts luôn dùng exitCode 2 cho public error nên test chỉ chứng minh hai giá trị đồng nhất; nguyên nhân PowerShell 7 là quan sát từ báo cáo người dùng, ghi trong tài liệu như quan sát, không có test.
  - _Why:_ Review: tránh khẳng định vượt quá bằng chứng; mở rộng cli-errors.test.ts thay vì file mới.

## Evidence

- `chk-focus` — pass (2026-10-20 11:36:20 +07:00): pnpm exec vitest run test/integration/scenarios/cli-errors.test.ts — exit 0
- `chk-gates` — pass (2026-10-20 11:36:24 +07:00): pnpm test:gates — exit 0
- `check-suite` — pass (2026-10-20 11:37:46 +07:00): pnpm test — exit 0
