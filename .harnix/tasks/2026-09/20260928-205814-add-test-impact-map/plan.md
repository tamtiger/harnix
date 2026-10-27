# Kế hoạch - [16] Repo-map hướng test-impact

## Các lát cắt (Slices)

- [x] S1. Mở rộng nhận diện test file và phân giải quan hệ trong core repo-map:
  - Cập nhật `src/core/repo-map/extract.ts` để `fileKind` nhận diện đúng test files của TypeScript (`.test.ts`, `.spec.ts`, `__tests__`), Python (`test_*.py`, `*_test.py`, `tests/`), Go (`*_test.go`).
  - Hỗ trợ thêm cạnh code→test qua quy ước đặt tên (colocated và mirrored directories) trong đồ thị hoặc traversal.
- [x] S2. Hiện thực tính năng test-impact `harnix repo-map --tests <path>`:
  - Hiện thực hàm `impactRepoMapTests` trong `src/core/repo-map/` và export qua `service.ts`.
  - Định nghĩa kiểu dữ liệu `RepoMapTestsResultV1` với format chuẩn `{ generator, schemaVersion, scope, status, target, limit, tests, truncated }`.
  - Cập nhật adapter `src/commands/repo-map-internal.ts` và CLI parser trong `src/cli-program.ts` hỗ trợ `--tests <path>` (kết hợp `--limit`).
- [x] S3. Loại bỏ ranker v1 không dùng và tối ưu complexity:
  - Gỡ bỏ `rankerVersion` và nhánh ranker v1 khỏi `src/core/repo-map/types.ts` và `src/core/repo-map/search.ts`.
  - Giảm complexity của `search.ts` xuống dưới 20, gỡ bỏ `src/core/repo-map/search.ts` khỏi danh sách miễn trừ `COMPLEX_SOURCE_FILES` trong `eslint.config.mjs`.
  - Cập nhật unit tests trong `test/unit/core/repo-map/` phản ánh việc gỡ bỏ ranker v1.
- [x] S4. Bổ sung fixtures và test cho TS, Python, Go:
  - Viết unit test và integration test xác minh `repo-map --tests` trả đúng test bị ảnh hưởng trên fixture của cả 3 hệ sinh thái TS, Python, Go.
  - Bảo đảm kiểm tra đầy đủ các ca: import trực tiếp, import gián tiếp (transitive), quy ước đặt tên (naming convention) và xử lý lỗi khi target/cache không tồn tại.
- [x] S5. Cập nhật chỉ dẫn trong Skills:
  - Cập nhật `src/skills/harnix-implement/SKILL.md` và `src/skills/harnix-verify/SKILL.md` hướng dẫn agent sử dụng `harnix repo-map --tests <path>` để chạy test bị ảnh hưởng trước khi chạy package suite.
  - Cập nhật `test/workflow/skill-sources.test.ts` kiểm tra các cụm từ chỉ dẫn mới.
- [x] S6. Đồng bộ tài liệu và version:
  - Cập nhật các tài liệu `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `README.md`.
  - Chạy `pnpm version:sync 2.0.0-dev.15 --summary "Repo-map test impact, support --tests for TS, Python, Go and remove unused ranker" --kind changed`.
  - Format code, chạy full checks và ghi nhận evidence.

## Kiểm chứng

- `check-tests-edge`: `pnpm vitest run test/unit/core/repo-map/ test/integration/commands/repo-map-internal.test.ts`
- `check-skill-use`: `pnpm vitest run test/workflow/skill-sources.test.ts`
- `check-docs-sync`: `pnpm vitest run test/unit/test-structure.test.ts test/workflow/architecture.test.ts`
- `check-suite`: `pnpm lint && pnpm typecheck && pnpm test`
