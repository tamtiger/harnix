# Kế hoạch — Bảo toàn cấu hình global của người dùng

Mọi thử nghiệm dùng home giả (`HOME`, `USERPROFILE`, `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, `XDG_CONFIG_HOME`, `APPDATA` trỏ vào thư mục tạm); không chạm profile thật.

## Checklist theo slice

- [x] Slice 1 (ac-1, R-010): `src/core/global/toml-guard.ts` (`findUserPromptSubmitConflict`, `detectEol`) + tùy chọn kiểm tra xung đột cho managed block của `config.toml` Codex + giữ kiểu xuống dòng khi nối/thay block.
- [x] Slice 2 (ac-2, R-011): `src/core/global/json-text.ts` (chỉnh JSON theo offset: chèn, thay, xóa phần tử mảng; tạo đường dẫn còn thiếu; phát hiện indent/EOL/BOM) và dùng nó thay `serializeJsonDocument` trong `reconcileJsonMember` và `removeObsoleteEntry`.
- [x] Slice 3 (ac-3, R-018): dọn khung JSON rỗng, xóa file `settings.json` rỗng do Harnix tạo, và dọn thư mục cha rỗng sau khi xóa file sở hữu (không vượt root).
- [x] Slice 4 (ac-4, R-019): `setup` gỡ fragment legacy đã bị thay thế (cùng `sourceId`, khác dạng) khi chưa bị sửa; giữ và báo khi đã bị sửa.
- [x] Slice 5 (ac-5, R-020): `reportActionableSetupReadiness` coi `setupNotice` là thông tin; `--dry-run` thoát 0; `update --global` dùng cùng báo cáo; ma trận exit code theo platform.
- [x] Slice 6 (ac-6, R-021): `harnix-research` xác minh `XDG_CONFIG_HOME` của OpenCode, ghi kết luận thành decision; áp dụng `envOverride` hoặc chẩn đoán theo kết luận; cập nhật `facts.ts` và `GLOBAL_SETUP_REFACTOR_PLAN.md`.
- [x] Slice 7 (ac-7, R-031, R-032): `createIsolatedUserEnvironment` ghi đè/gỡ mọi biến relocate; `smoke:tarball` và `scan:release` phủ `--opencode` và `--cursor`; `isTestProcess` một định nghĩa trong `src/utils`, chỉ dựa `VITEST`.
- [x] Slice 8 (ac-8): `typecheck`, `lint`, `test` (coverage 95.03 / 89.4 / 98.74), `pack:check`, `smoke:tarball` và `scan:release` đều xanh cục bộ; evidence chính thức ghi bằng `--run-check` ở giai đoạn verifying.

## Thứ tự RED rồi GREEN

- **Slice 1:** RED `toml-guard.test.ts` (bảng: `[hooks]\nUserPromptSubmit = []`, `hooks.UserPromptSubmit = []`, `[hooks.UserPromptSubmit]`, `hooks = { UserPromptSubmit = [] }`, và các dạng hợp lệ `[[hooks.UserPromptSubmit]]`, `[hooks.state]`, `UserPromptSubmit` nằm trong bảng khác) và `test/platform/codex-global.test.ts` (setup trên file xung đột giữ nguyên byte, readiness `drifted`; file CRLF nhận block CRLF). GREEN: module + hook trong `reconcileManagedBlock`.
- **Slice 2:** RED `json-text.test.ts` (table: insert vào mảng rỗng/không rỗng, thiếu `hooks`, indent 2/4/tab, CRLF, BOM, số lớn, key không theo thứ tự alphabet; remove giữ dấu phẩy đúng; property "chèn rồi xóa trả lại đúng chuỗi gốc") và `claude-global.test.ts` (setup rồi uninstall trả `settings.json` đúng từng byte; số `12345678901234567890` còn nguyên). GREEN: module + thay chỗ ghi.
- **Slice 3:** RED test `global-uninstall.test.ts`/`claude-global.test.ts` (home rỗng: setup rồi uninstall không còn file/thư mục Harnix tạo; file có nội dung người dùng giữ nguyên; thư mục có file của người dùng không bị xóa). GREEN: dọn dẹp.
- **Slice 4:** RED `codex-global.test.ts` dùng `setupPlatforms` với fixture `hooks.json` legacy chưa sửa và đã sửa. GREEN: sửa `setup.ts`/reconcile.
- **Slice 5:** RED `cli-helpers.test.ts` + integration `setup` (cursor/opencode sạch thoát 0, dry-run thoát 0, drifted thoát 1) và `update --global` drifted. GREEN: sửa `cli-helpers.ts`, `cli-project-commands.ts`.
- **Slice 6:** research chỉ đọc trước, rồi RED test `user-paths`/`opencode-global.test.ts` theo kết luận; GREEN theo kết luận.
- **Slice 7:** RED `test/safety/isolated-user-home.test.ts` (env có `CLAUDE_CONFIG_DIR` thật bị ghi đè; mọi biến relocate nằm trong home giả) và `test/unit/utils/test-process.test.ts` (`NODE_ENV=test` mà không có `VITEST` không làm `isTestProcess()` đúng; một định nghĩa duy nhất trong `src/utils/test-process.ts`). GREEN: sửa script và `isTestProcess`. Smoke/scan: chạy `pnpm pack:check` rồi `pnpm smoke:tarball`.

Ghi chú TDD: dọn tài liệu thuần văn bản dùng ngoại lệ đã ghi và thay bằng test parity.

## Mỗi check chứng minh điều gì

- `check-platform` (test platform, integration, safety, unit core/commands): ac-1 đến ac-6.
- `check-release-scripts` (`test/safety`): ac-7 phần cô lập home.
- `check-smoke` (`pnpm run smoke:tarball`, cần `pnpm pack:check` trước): ac-7 phần smoke OpenCode, Cursor.
- `check-typecheck`, `check-lint`, `check-suite`: cổng chất lượng cuối (ac-8).

## Bảo toàn

Không đổi manifest schema, ownership hay lock. Golden snapshot chỉ sinh lại nếu `workflow --schema` đổi (không dự kiến). Không commit khi chưa được duyệt. File `.harnix/` và `docs/prompts/harnix-comprehensive-review.md` chưa theo dõi: giữ nguyên.
