# Thêm lệnh đo token thực tế của một vòng đời task

- **ID:** 20261001-185520-measure-token-baseline
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-01 18:55:20 +07:00
- **Updated:** 2026-10-01 19:14:53 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Thêm script pnpm measure:tokens (scripts/measure-tokens.mjs) chạy một vòng đời Lite thật trong repo tạm với home cô lập rồi in một JSON số token (ceil(ký tự/4), cùng tokenApproximation của dự án) theo từng bước: khối instruction luôn nạp, workflow.md, các skill, preflight, schema, từng lệnh workflow có và không có --brief, hook context lúc planning và in_progress, status/inspect. Đây là đường cơ sở để task cắt token chứng minh mức giảm. Bump gói lên 2.0.0-dev.11 bằng pnpm version:sync và ghi CHANGELOG.md.

## Non-goals

- Không đổi hành vi của bất kỳ lệnh harnix nào
- Không dùng tokenizer thật hay gọi network
- Không ghi vào home thật hay vào repo Harnix

## Acceptance criteria

- `ac-measure-guard` (met): Hàm báo cáo của script ước token bằng ceil(ký tự/4), tổng hợp theo bước, và script thoát khác 0 khi một lệnh đo trả exit khác 0 (không nuốt lỗi); package.json và test hợp đồng package liệt kê script measure:tokens.
- `ac-measure-run` (met): pnpm run measure:tokens thoát 0 trên repo tạm cô lập và in một JSON có các khóa alwaysLoaded, workflowDoc, skills, preflight, steps (mỗi lệnh workflow có giá trị brief và không brief) và hookContext (planning và in_progress); không chạm home thật hay repo Harnix.

## Required checks

- `chk-measure-unit` (focused): Test hàm báo cáo, exit khác 0 khi lệnh đo lỗi và hợp đồng package — pass (2026-10-01 19:12:52 +07:00)
- `chk-measure-run` (focused): Chạy measure:tokens trên bản build hiện tại (chạy pnpm build trước) — pass (2026-10-01 19:13:11 +07:00)
- `chk-suite` (full): Project suite gate — pass (2026-10-01 19:14:40 +07:00)

## Decisions

- **d-baseline** — Số đo thật (repo tạm, ceil(ký tự/4)): hook context khi có active task = 1.307 token mỗi prompt ở fixture JavaScript (nhúng nguyên guide, không khử trùng lặp theo phiên); repo Harnix có guides typescript.md + common.md = 11.565 ký tự, ước ~2,9k token mỗi prompt. Lệnh workflow không --brief: transition 195-198, criterion 259, finish 270, save 196 token; có --brief còn 30-33, 33, 85, 31. Cả vòng đời Lite có --brief ~0,3k token output. preflight 79-104 token ở repo trống nhưng ~375 ở repo này vì learning. schema 744, status 121, status --explain 360, inspect 221.
  - _Why:_ Chi phí lặp lại mỗi prompt của hook lớn hơn toàn bộ lệnh vòng đời; task cắt token phải ưu tiên nó và dùng script này làm đường cơ sở.
- **d-run-check-cmd-exe** — Trên Windows, harnix workflow --run-check với executable tên trần (pnpm, pwsh) đi qua cmd.exe nên từ chối đối số chứa & | < > ^ % với thông báo "unsafe for cmd.exe" mà không nói cách xử lý; check ghép như lint && typecheck && test chạy được bằng tên có đuôi, ví dụ pwsh.exe -NoProfile -Command "..." (hoặc đường dẫn đầy đủ).
  - _Why:_ Agent mất một lần chạy lại và phải đọc check-runner.ts để biết cách; nên nêu trong thông báo lỗi và cookbook.

## Evidence

- `chk-measure-unit` — pass (2026-10-01 19:12:52 +07:00): pnpm — exit 0
- `chk-measure-run` — pass (2026-10-01 19:13:11 +07:00): pnpm — exit 0
- `chk-suite` — pass (2026-10-01 19:14:40 +07:00): pwsh.exe — exit 0
