# Plan: Sửa độ liên quan của repo-map --query khi có task đang active

Task: `20261109-200112-repo-map-query-relevance` · Epic: `20261109-194501-repo-map-insights` (member 3) · Phiên bản: `2.31.0-dev.3`

## Execution Slices

- [x] [chk-focused] Slice 1: test hỏng cho bonus task, khớp chính xác, camelCase, fallback và bộ truy vấn vàng (ac-1, ac-2, ac-3, ac-4)
- [x] [chk-focused] Slice 2: bonus task chỉ cho file có lexical match ở seed và rank (ac-1)
- [x] [chk-focused] Slice 3: module search-terms, tách camelCase và khớp chính xác trước (ac-2, ac-4)
- [x] [chk-focused] Slice 4: tra tham chiếu khi token identifier không có trong chỉ mục (ac-4)
- [x] [chk-focused] Slice 5: bộ truy vấn vàng và đo trên his, payment_hub (ac-3)
- [x] [chk-gates] Slice 6: tài liệu, CHANGELOG, phiên bản 2.31.0-dev.3 (ac-3)
- [x] [chk-suite] Slice 7: lint, typecheck, test:gates, suite và rà soát tuân thủ (ac-1, ac-2, ac-3, ac-4)

### Slice 1: test hỏng

- `test/unit/core/repo-map/search.test.ts` (mirror `search.ts`): truy vấn vô nghĩa khi có `relevantPaths` và `taskTerms` trả rỗng; file của task không khớp từ khóa không xuất hiện; file của task có khớp được cộng điểm; khớp chính xác thắng khớp mờ và tiền tố; `cache` khớp `SessionCache`; đường dẫn `session-cache.ts` vẫn khớp `session cache`; bộ truy vấn vàng từ corpus `test/support/repo-map-query-fixtures.ts`.
- `test/unit/core/repo-map/search-terms.test.ts`: tách camelCase và chữ số.
- `test/unit/core/repo-map/service.test.ts`: fallback tra tham chiếu cho token chỉ được dùng.
- Chạy `pnpm exec vitest run repo-map` và thấy hỏng đúng lý do.

### Slice 2: bonus task có điều kiện

- `search.ts`: `seedPaths` chỉ gồm kết quả lexical; trong `rank()` các bonus `relevant`, `taskTerms`, `packagePath`, `languageTerms` chỉ cộng khi `lexicalMatch`; bonus đồ thị giữ nguyên vì seed đã là lexical.

### Slice 3: search-terms và khớp chính xác

- `src/core/repo-map/search-terms.ts` (spec `search-terms.test.ts`): `splitIdentifierWords`, `terms(record)` (thêm các từ tách từ identifiers), `normalizeTerm`.
- `search.ts`: chạy tìm chính xác trước (`fuzzy: false`, `prefix: false`); nếu có kết quả thì dùng chỉ kết quả đó, ngược lại dùng tìm mờ và tiền tố như cũ.

### Slice 4: fallback tham chiếu

- `service.ts` (`queryRepoMap`): khi kết quả rỗng và truy vấn là một token định danh hợp lệ (`^[A-Za-z_$][\w$]{0,127}$`), gọi `findRepoMapReferences` (cùng cơ chế `--refs`), gom theo file và trả kết quả có `reasons: ["reference fallback"]`; `QueryRepoMapResult` thêm `fallback?: "references"`; `queryRepoMapInternal` in trường `fallback` khi có.

### Slice 5: bộ truy vấn vàng và đo thật

- Corpus fixture mô phỏng tên file và identifier thật (session cache, text integrity mojibake, run-check circuit breaker, epic order, `payServiceFee`, `generateAutoKeyM01ReceiptCode`, `PaymentRequestCode`, `SplitCode`); ít nhất 8 cặp truy vấn và file mong đợi trong top 3, chạy khi có task active.
- Đo lại trên bản sao `his`, `payment_hub` và repo này: ba truy vấn đã đo trước đó và truy vấn vô nghĩa.

### Slice 6: tài liệu và phiên bản

- `docs/IMPLEMENTATION_PLAN.md` mục 4.12 (điều kiện bonus task, khớp chính xác, fallback; rollback bằng `git revert`), `docs/HARNIX_PRD.md`, `docs/HARNESS_RESEARCH.md` (hàng ranking), `README.md` (dòng `repo-map`).
- `pnpm version:sync 2.31.0-dev.3 --summary "..." --kind changed`; CHANGELOG; khôi phục bảng README bằng `.harnix/tmp/fix-readme-table.mjs` nếu `version:sync` căn lại bảng; `pnpm format`.

### Slice 7: xác minh

- `pnpm run test:gates` ngay sau khi thêm file test; `pnpm run lint`, `pnpm run typecheck`, `pnpm exec vitest run repo-map`, `pnpm run test:gates`, `pnpm run test`; rà soát tuân thủ rồi `--finish`.

## Guardrails & Invariants

- Test hỏng trước, không nới test để qua.
- Chỉ cộng thêm trường `fallback`; không đổi schema, enum, `--limit`.
- `core` không phụ thuộc Commander, Inquirer hay template; file `src` dưới 300 dòng; test dưới 400 dòng; mỗi module `src` có spec; không `../` trong import của test.
- Giữ thay đổi chưa commit của người dùng; không commit, không tạo nhánh.

## Verification Matrix

| Check | Lệnh | Phủ | Chứng minh |
| --- | --- | --- | --- |
| `chk-focused` | `pnpm exec vitest run repo-map` | ac-1, ac-2, ac-3, ac-4 | bonus task có điều kiện, camelCase, khớp chính xác, fallback, bộ truy vấn vàng |
| `chk-gates` | `pnpm run test:gates` | ac-3 | hợp đồng CLI, tài liệu, kiến trúc, ngân sách skill |
| `chk-suite` | `pnpm run test` | ac-1 đến ac-4 | toàn bộ test và coverage |
