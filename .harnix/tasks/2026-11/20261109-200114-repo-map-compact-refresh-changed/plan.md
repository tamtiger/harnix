# Plan: Rút gọn output repo-map, giới hạn --refresh và kích hoạt agent dùng repo-map

Task: `20261109-200114-repo-map-compact-refresh-changed` · Epic: `20261109-194501-repo-map-insights` (member 5, đóng epic) · Phiên bản: `2.31.0`

## Execution Slices

- [x] [chk-focused] Slice 1: test hỏng cho format compact, xác thực cờ và tóm tắt refresh (ac-1, ac-2)
- [x] [chk-focused] Slice 2: format compact cho outline, refs, impact, tests và xác thực --format (ac-1)
- [x] [chk-focused] Slice 3: tóm tắt output của refresh (ac-2)
- [x] [chk-hook] Slice 4: gợi ý tĩnh trong tiêu đề lean của hook context (ac-5)
- [x] [chk-gates] Slice 5: chỉ thị trong skill, khối AGENTS, ngân sách token và RULE_OWNERSHIP (ac-4)
- [x] [chk-focused] Slice 6: đo kích thước compact, output refresh và token (ac-1, ac-2, ac-5)
- [x] [chk-gates] Slice 7: tài liệu, CHANGELOG, bản phát hành 2.31.0 --fold-dev (ac-6)
- [x] [chk-suite] Slice 8: lint, typecheck, test:gates, suite và rà soát tuân thủ (ac-1, ac-2, ac-4, ac-5, ac-6)

### Slice 1: test hỏng

- `test/unit/core/repo-map/compact.test.ts`: `parseRepoMapListFormat` (chỉ `json` và `compact`), `compactRefs`, `compactImpact`, `compactTests`, `compactOutline` (chuỗi ngắn, nhỏ hơn json).
- `test/unit/cli-helpers.test.ts`: `--format` hợp lệ với query, outline, refs, impact, tests; bị từ chối với `--refresh` và `--events` kèm hint; `--format outline` chỉ với query; `--body` với `--format compact` bị từ chối.
- `test/unit/core/repo-map/refresh-summary.test.ts`: `summarizeSkipped` (tối đa 10, bỏ tên nhạy cảm, tách marker `limit`, `skippedTotal`).
- Chạy và thấy hỏng đúng lý do.

### Slice 2: format compact

- `src/core/repo-map/compact.ts` (≤ 300 dòng, nếu vượt tách `compact-lists.ts` kèm spec): `parseRepoMapListFormat`, `compactRefs`, `compactImpact`, `compactTests`, `compactOutline`; mỗi kết quả giữ phần đầu (generator, schemaVersion, scope, status, target, limit, truncated, hint) và thêm `format: "compact"`.
- `cli-helpers.ts`: `validateFormatFlag` (hàm riêng để giữ complexity ≤ 20); `repo-map-internal.ts`: các hàm outline, refs, impact, tests nhận `format`.
- Khai báo `--format` trong `cli-workflow-commands.ts` đã có; cập nhật mô tả cờ.

### Slice 3: tóm tắt refresh

- `src/core/repo-map/refresh-summary.ts` (spec `refresh-summary.test.ts`): `summarizeSkipped(skipped)` trả `{ skipped (tối đa 10, không nhạy cảm theo secretPath, không marker), skippedTotal, limitReached }`.
- `repo-map-internal.ts` (`refreshRepoMapInternal`) và `workspace.ts` (kết quả từng member) dùng nó; cập nhật test tích hợp và golden liên quan.

### Slice 4: hook

- `src/core/context/effective-context.ts` (`taskSummaryHeader`): thêm một dòng tĩnh `Tip: ...` nêu `--refs`, `--outline --symbol --body` và `--tests` trước `grep -r` hoặc `sed -n` lặp; chỉ ở chế độ lean; test `effective-context.test.ts` (đo mức tăng token ≤ 35) và golden liên quan được cập nhật đúng chuỗi mới.

### Slice 5: kích hoạt

- Skill `harnix-plan`, `harnix-implement`, `harnix-debug`: thay mệnh đề "navigation hints only" bằng chỉ thị ngắn; `src/templates/harnix/activation.ts` (`HARNIX_RULES`, quy tắc Token economy): thêm một mệnh đề; mọi bề mặt nền tảng dùng cùng văn bản.
- `src/templates/harnix/token-budgets.json`: nâng `alwaysLoaded` và `skills.harnix-plan` theo số đo `pnpm measure:tokens` (kèm biên nhỏ) và ghi quyết định; `docs/RULE_OWNERSHIP.md`: dòng "Điều hướng mã bằng repo-map".
- Cập nhật golden nền tảng (Kiro, Antigravity, Claude, Codex) đúng chuỗi mới; kiểm tra `instruction-budget`, `rule-ownership`, `skill-sources`.

### Slice 6: đo thực tế

- Bản sao `his`, `payment_hub` và repo này: kích thước `--refs`, `--impact`, `--tests`, `--outline` ở json so với compact và so với `grep -rn`; kích thước output `--refresh` ở `his` (trước: 17.929 byte); `pnpm measure:tokens` cho `alwaysLoaded`, `harnix-plan` và `hookContext`.

### Slice 7: tài liệu và phát hành

- `docs/IMPLEMENTATION_PLAN.md` (nối thêm đoạn compact và refresh, không thay anchor), `docs/HARNIX_PRD.md`, `README.md` (dòng `repo-map`), `docs/HARNESS_RESEARCH.md`, `AGENTS.md` và `src/templates/AGENTS.md` nếu mô tả khối bootstrap đổi.
- `pnpm version:sync 2.31.0 --fold-dev` (bản đóng epic, gộp mọi mục `2.31.0-dev.*` vào một mục CHANGELOG); khôi phục bảng README bằng `.harnix/tmp/fix-readme-table.mjs` nếu cần; `pnpm format`; chạy `pnpm selfhost:sync` nếu template workflow đổi (không dự kiến).

### Slice 8: xác minh

- `pnpm run test:gates` ngay sau khi thêm file test; `pnpm run lint`, `pnpm run typecheck`, `pnpm exec vitest run repo-map`, `pnpm exec vitest run context`, `pnpm run test:gates`, `pnpm run test`; rà soát tuân thủ, `--finish`, sau đó review cả epic một lần.

## Guardrails & Invariants

- Test hỏng trước; không nới test để qua; golden chỉ đổi đúng chuỗi mới.
- Chỉ cộng thêm trường; không đổi schema, enum, giao thức hook.
- Không lộ tên file nhạy cảm; không in secret.
- File `src` dưới 300 dòng code, complexity ≤ 20; mỗi module `src` có spec; test dưới 400 dòng; không `../` trong import của test.
- Mọi thay đổi trần token có quyết định ghi lại.
- Giữ thay đổi chưa commit của người dùng; không commit, không tạo nhánh.

## Verification Matrix

| Check | Lệnh | Phủ | Chứng minh |
| --- | --- | --- | --- |
| `chk-focused` | `pnpm exec vitest run repo-map` | ac-1, ac-2 | format compact, xác thực cờ, tóm tắt refresh |
| `chk-hook` | `pnpm exec vitest run context` | ac-5 | dòng gợi ý hook tĩnh, mức tăng token |
| `chk-gates` | `pnpm run test:gates` | ac-4, ac-6 | hợp đồng CLI, tài liệu, ngân sách, ownership, nguồn skill |
| `chk-suite` | `pnpm run test` | ac-1, ac-2, ac-4, ac-5, ac-6 | toàn bộ test và coverage |
