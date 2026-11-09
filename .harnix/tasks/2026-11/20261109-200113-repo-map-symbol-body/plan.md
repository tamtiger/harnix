# Plan: Thêm repo-map --outline --symbol --body

Task: `20261109-200113-repo-map-symbol-body` · Epic: `20261109-194501-repo-map-insights` (member 4) · Phiên bản: `2.31.0-dev.4`

## Execution Slices

- [x] [chk-focused] Slice 1: test hỏng cho che secret, cắt thân, từ chối đường dẫn và cờ CLI (ac-1, ac-2, ac-3)
- [x] [chk-focused] Slice 2: module outline-body với che secret và cắt thân (ac-1, ac-2)
- [x] [chk-focused] Slice 3: nối --body vào outline, service và CLI (ac-1, ac-3)
- [x] [chk-focused] Slice 4: đo trên his, payment_hub và repo này (ac-1)
- [x] [chk-gates] Slice 5: tài liệu, CHANGELOG, phiên bản 2.31.0-dev.4 (ac-4)
- [x] [chk-suite] Slice 6: lint, typecheck, test:gates, suite và rà soát tuân thủ (ac-1, ac-2, ac-3, ac-4)

### Slice 1: test hỏng

- `test/unit/core/repo-map/outline-body.test.ts`: `redactSecretLines` (năm dạng secret, khối private key, dòng thường giữ nguyên, số dòng giữ nguyên) và `attachSymbolBodies` (lấy đúng dòng, tổng 200 dòng chia cho nhiều symbol, `bodyTruncated`).
- `test/unit/core/repo-map/outline.test.ts`: `--body` qua `outlineRepoMap` với file đã lập chỉ mục, file chưa lập chỉ mục, file bị `.harnixignore`, file `application/config/database.php`; thân bị che secret.
- `test/unit/cli-helpers.test.ts` (hoặc file tương ứng của `cli-helpers.ts`): `--body` thiếu `--symbol` hoặc `--outline` bị từ chối kèm hint.
- Chạy và thấy hỏng đúng lý do.

### Slice 2: outline-body

- `src/core/repo-map/outline-body.ts`: `MAX_BODY_LINES = 200`; `redactSecretLines(lines)` che toàn dòng khớp: khóa kiểu `'password' => '...'`, JSON `"password": "..."`, gán chỉ mục `['password'] = '...'`, `password=...` trong chuỗi kết nối, URL có `user:pass@`, `Bearer <token>`, và các dòng trong khối `-----BEGIN ... PRIVATE KEY-----`; `attachSymbolBodies(text, symbols)` cắt thân từng symbol theo `startLine` và `endLine`, tổng tối đa 200 dòng, đánh dấu `bodyTruncated`; `isBodyBlockedPath(path)` cho `database.php`, `wp-config`, `local_settings` và các dạng tương tự ngoài `secretPath` của inventory.

### Slice 3: nối vào outline, service, CLI

- `types.ts`: `RepoMapOutlineOptions.body?`, `RepoMapSymbolOutlineV1.body?` và `bodyTruncated?`, `RepoMapOutlineResultV1.hint?`.
- `outline.ts`: khi `options.body === true` gọi `attachSymbolBodies` trên thân đã đọc (không đọc lại file).
- `service.ts` (`outlineRepoMap`): với `body`, đọc cache; file không có trong cache, hoặc bị chặn bởi `isBodyBlockedPath`, trả `status: skipped` (kèm `hint` khi chưa lập chỉ mục).
- `cli-workflow-commands.ts`: cờ `--body`; `cli-helpers.ts` (`RepoMapCliOptions`, `validateRepoMapOptions`): `--body` cần `--outline` và `--symbol`, lỗi có hint; `repo-map-internal.ts` truyền `body`.

### Slice 4: đo thực tế

- Bản sao `his` (PHP, file model lớn `M17C78Model.php`), `payment_hub` (C#) và repo này (TypeScript): so sánh kích thước `--outline --symbol <tên> --body` với cửa sổ `sed -n` tương ứng, và kiểm tra dòng secret thật (nếu có) bị che.

### Slice 5: tài liệu và phiên bản

- `docs/IMPLEMENTATION_PLAN.md` mục 4.16 (tạo mục outline cho `--body`), `docs/HARNIX_PRD.md`, `README.md` (dòng `repo-map`), `docs/HARNESS_RESEARCH.md` mục 3.13 (outline); `pnpm version:sync 2.31.0-dev.4 --summary "..." --kind added`; khôi phục bảng README bằng `.harnix/tmp/fix-readme-table.mjs` nếu cần; `pnpm format`.

### Slice 6: xác minh

- `pnpm run test:gates` ngay sau khi thêm file test; `pnpm run lint`, `pnpm run typecheck`, `pnpm exec vitest run repo-map`, `pnpm run test:gates`, `pnpm run test`; rà soát tuân thủ rồi `--finish`.

## Guardrails & Invariants

- Test hỏng trước; không nới test để qua.
- Chỉ cộng thêm trường tùy chọn; không đổi schema, enum, `--limit`.
- Không in secret; thà che thừa; chặn đường dẫn nhạy cảm và file chưa lập chỉ mục.
- `outline.ts` không vượt 300 dòng code; mỗi module `src` có spec; test dưới 400 dòng; không `../` trong import của test.
- Giữ thay đổi chưa commit của người dùng; không commit, không tạo nhánh.

## Verification Matrix

| Check | Lệnh | Phủ | Chứng minh |
| --- | --- | --- | --- |
| `chk-focused` | `pnpm exec vitest run repo-map` | ac-1, ac-2, ac-3 | thân symbol, trần dòng, che secret, từ chối đường dẫn và cờ |
| `chk-gates` | `pnpm run test:gates` | ac-4 | hợp đồng CLI, tài liệu, kiến trúc, ngân sách skill |
| `chk-suite` | `pnpm run test` | ac-1 đến ac-4 | toàn bộ test và coverage |
