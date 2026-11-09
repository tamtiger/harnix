# Plan: Sửa thứ hạng repo-map --tests

Task: `20261109-200111-repo-map-tests-ranking` · Epic: `20261109-194501-repo-map-insights` (member 2) · Phiên bản: `2.31.0-dev.2`

## Execution Slices

- [x] [chk-focused] Slice 1: test hỏng cho quy ước tên và xếp bậc (ac-1, ac-2)
- [x] [chk-focused] Slice 2: module test-convention với thư mục chuẩn hóa và project X.Tests (ac-1)
- [x] [chk-focused] Slice 3: xếp bậc, reasons và trần bắc cầu trong tests.ts (ac-1, ac-2)
- [x] [chk-focused] Slice 4: đo trên his và payment_hub (ac-2)
- [x] [chk-gates] Slice 5: tài liệu, CHANGELOG, phiên bản 2.31.0-dev.2 (ac-3)
- [x] [chk-suite] Slice 6: lint, typecheck, test:gates, suite và rà soát tuân thủ (ac-1, ac-2, ac-3)

### Slice 1: test hỏng

- `test/unit/core/repo-map/test-convention.test.ts`: `extractTestStem`, `findConventionTests` (cạnh file, `__tests__`, thư mục phản chiếu, monorepo lồng, `X.Tests`, PHP, tên khác).
- `test/unit/core/repo-map/tests-ranking.test.ts`: test viết cho file đứng trước 25 test chỉ chung symbol dù `--limit 5`; thứ tự và nhãn bốn bậc; tối đa 5 bắc cầu; symbol khai báo ở hơn 4 file bị bỏ; C# và PHP monorepo; fixture TypeScript sau `refresh`.
- Chạy và thấy hỏng đúng lý do trước khi sửa mã.

### Slice 2: test-convention

- `src/core/repo-map/test-convention.ts` (spec `test-convention.test.ts`): bỏ hậu tố `.Tests`/`.UnitTests` của từng đoạn thư mục trước, rồi bỏ các đoạn bố cục (`src`, `lib`, `pkg`, `app`, `test`, `tests`, `spec`, `specs`, `unit`, `integration`, `__tests__`); hai cây khớp khi bằng nhau, khi test ở gốc thư mục test, hoặc khi một cây là hậu tố đoạn của cây kia.
- `extractTestStem` giữ các quy ước hiện có (`.test`, `.spec`, `_test`, `test_`, `Test`, `Tests`, `TestCase`).

### Slice 3: xếp bậc

- `src/core/repo-map/tests.ts`: bốn bậc `convention` < `direct` < `symbol` < `transitive`; mỗi test giữ liên kết mạnh nhất; sắp theo bậc, khoảng cách, code-unit; bắc cầu tối đa 5; `reasons` cho các test được liệt kê.
- Bậc `symbol` chỉ dùng tên khai báo ở 1 đến 4 file nguồn (`MAX_NAME_DECLARERS` của `references.ts`).
- Cập nhật `test/integration/commands/repo-map-internal.test.ts` (khớp một phần, vì có thêm `reasons`).

### Slice 4: đo trên repo thật

- Bản sao `git archive` của `his`, `payment_hub` và chính repo này; chạy `--tests` cho các file đã đo (`store.ts`, `text-integrity.ts`, `graph.ts`, `git.ts`, `paths.ts`, `PaymentRequestAppService.cs`) và kiểm tra test trực tiếp nằm trong top 5.

### Slice 5: tài liệu và phiên bản

- `docs/IMPLEMENTATION_PLAN.md` mục 4.16 (`--tests` và `reasons`), `docs/HARNIX_PRD.md`, `README.md` (dòng `repo-map`), `docs/HARNESS_RESEARCH.md` nếu cần; không đổi template workflow.
- `pnpm version:sync 2.31.0-dev.2 --summary "..." --kind changed`; CHANGELOG; `pnpm format`.

### Slice 6: xác minh

- `pnpm run lint`, `pnpm run typecheck`, `pnpm exec vitest run repo-map`, `pnpm run test:gates`, `pnpm run test`; rà soát tuân thủ rồi `--finish`.

## Guardrails & Invariants

- Test hỏng trước, không nới test để qua (ngoại lệ có lý do: test tích hợp so khớp chính xác output nay chấp nhận thêm `reasons`).
- Chỉ cộng thêm trường tùy chọn `reasons`; không đổi schema, enum, `--limit`.
- `core` không phụ thuộc Commander, Inquirer hay template; file `src` dưới 300 dòng; test dưới 400 dòng; mỗi module `src` có spec.
- Giữ thay đổi chưa commit của người dùng; không commit, không tạo nhánh.

## Verification Matrix

| Check | Lệnh | Phủ | Chứng minh |
| --- | --- | --- | --- |
| `chk-focused` | `pnpm exec vitest run repo-map` | ac-1, ac-2 | quy ước tên, xếp bậc, reasons, trần bắc cầu, fixture |
| `chk-gates` | `pnpm run test:gates` | ac-3 | hợp đồng CLI, tài liệu, kiến trúc, ngân sách skill |
| `chk-suite` | `pnpm run test` | ac-1, ac-2, ac-3 | toàn bộ test và coverage |
