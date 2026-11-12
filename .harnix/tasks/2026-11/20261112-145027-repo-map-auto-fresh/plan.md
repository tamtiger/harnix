# Implementation Plan: Repo-map tự phát hiện và làm mới cache cũ khi truy vấn

## Execution Slices

### Slice 1: Phát hiện cache cũ rẻ tiền (ac-1)
- [x] [chk-fresh-2] RED: `test/unit/core/repo-map/freshness.test.ts` (kho tạm: thêm, sửa nội dung, xóa file; file không đổi không bị đọc, đếm số lần đọc qua dependency inject; sửa mtime mà nội dung giữ nguyên vẫn `fresh`; không ghi gì). GREEN: thêm `mtimeMs` vào `RepoMapInventoryFile` (`src/core/repo-map/inventory.ts`, `types.ts`; không lưu vào cache), tạo `src/core/repo-map/freshness.ts` với `repoMapFreshness`; dùng thời điểm ghi cache (mtime của `repo-map-v1.json`) làm ngưỡng.

### Slice 2: Tự làm mới khi truy vấn và cờ --cached (ac-2, ac-3)
- [x] [chk-fresh-2] RED: `test/integration/scenarios/repo-map-freshness.test.ts` (cache cũ: mỗi lệnh `--query|--refs|--outline|--tests|--impact` ra kết quả đúng với file mới và `freshness: "refreshed"`; cache mới: output y hệt trước và cache không bị ghi, mtime không đổi; `--cached` không ghi và không đọc nội dung; refresh lỗi giả lập: dữ liệu cũ, `freshness: "stale"`, hint `--refresh`, exit 0; `--workspace` và hook `context` không đổi), cập nhật `repo-map-incremental` và `read-only-commands` nếu hợp đồng chỉ-đọc cần nới cho cache. GREEN: bọc đường đọc cache trong `src/core/repo-map/service.ts` (một hàm `ensureFreshRepoMap`), nối vào `src/commands/repo-map-internal.ts`, khai báo `--cached` ở `src/cli-workflow-commands.ts` và kiểm tra tổ hợp cờ ở `src/cli-helpers.ts` (cờ không hợp lệ với `--refresh`, `--events`, `--workspace`); `--format compact` chỉ thêm `freshness` khi không phải fresh.

### Slice 3: Đo, đồng bộ tài liệu, version (ac-4)
- [x] [chk-gates] Đo thời gian kiểm tra và refresh trên repo C# lớn (xin phép trước khi ghi cache vào repo thật, hoặc dùng bản sao), ghi `trace-` decision; cập nhật `--help`, README, AGENTS.md (mục repo-map và hook), `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, dòng skill nếu cần và còn trong trần token; golden bằng `HARNIX_UPDATE_GOLDEN=1` chỉ cho chuỗi mới; `pnpm version:sync <patch> --summary ... --kind fixed`; `pnpm format`.
- [x] [check-suite] `pnpm run test` xanh (kèm lint và typecheck).

## Guardrails & Invariants
- Cache còn mới: output và hiệu năng gần như không đổi; không ghi.
- Không đọc nội dung file không đổi khi kiểm tra; không mở rộng phạm vi inventory.
- Không đổi schema cache và các trường output hiện có; chỉ thêm trường `freshness` khi cần.
- Hook không chạy repo-map; `doctor` giữ nguyên.
- Refresh lỗi không làm hỏng cache cũ và không làm lệnh thất bại.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3 | chk-fresh-2 | `pnpm exec vitest run test/unit/core/repo-map/freshness.test.ts test/integration/scenarios/repo-map-freshness.test.ts test/integration/scenarios/repo-map-incremental.test.ts test/integration/scenarios/read-only-commands.test.ts` | focused |
| ac-4 | chk-gates | `pnpm test:gates` | focused |
| ac-1, ac-2, ac-3, ac-4 | check-suite | `pnpm run test` | full |
