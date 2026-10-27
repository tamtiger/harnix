# Implementation Plan: Chuẩn hóa EOL khi băm inputDigest, giữ tương thích digest cũ

## Hiện trạng đã đối chiếu với mã
- `src/core/verification/input-digest.ts`: `hashEntries` đọc file bằng `readFile` và `hashBytes`; `computeInputDigest` trả `inputDigest` (`digest: 4`) và `legacyInputDigest` (`digest: 3`); `digestMatches(snapshot, recorded)` chấp nhận hai giá trị đó. Người dùng của nó: `criterion.ts`, `run-check.ts`, `evidence-flags.ts`, `completion.ts`, `suite-gate.ts`, `check-report.ts`, `task-audit.ts`, `snapshot.ts`.
- Ba file Git coi là nhị phân đã được chuẩn hóa trong bước định dạng (xem Slice 0).
- `test/unit/core/verification/input-digest.test.ts` đã 398 dòng nên test mới ở file riêng.

## Hợp đồng (contract)
- `src/core/verification/line-endings.ts`: `isTextContent(content: Uint8Array): boolean` (không chứa byte 0) và `normalizeLineEndings(content: Uint8Array): Uint8Array` (file văn bản: `\r\n` thành `\n`, CR đơn giữ nguyên; file nhị phân: trả nguyên).
- `InputDigestSnapshot` thêm `rawInputDigest: string`; `entries` mang hash đã chuẩn hóa; `inputDigest` = `hashText(JSON.stringify({ digest: 4, taskId, checkId, taskContractHash, entries }))` (không đổi công thức, đổi dữ liệu entry); `rawInputDigest` cùng công thức trên entry byte thô; `legacyInputDigest` giữ nguyên trên entry byte thô.
- `digestMatches` chấp nhận ba giá trị.
- Repo toàn file LF: `inputDigest === rawInputDigest` và không digest nào đã lưu đổi.

## Execution Slices

### Slice 0: bước định dạng, tách khỏi logic
- [x] Chuẩn hóa `src/core/verification/input-digest.ts` (CR đơn thành CRLF cùng quy ước thư mục làm việc), thay byte NUL bằng escape `\u0000` trong `init-task.ts` (regex `[^\u0000-\u007f]`) và `task-validate-contracts.test.ts`; không đổi hành vi (615 test liên quan xanh).

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/core/verification/line-endings.test.ts` (mới): CRLF thành LF, CR đơn giữ, LF giữ, nhị phân giữ nguyên, rỗng.
- [x] [chk-focus] Cùng file `line-endings.test.ts` (quy tắc test mirror src không cho file mồ côi; `input-digest.test.ts` đã 398 dòng): cùng nội dung LF và CRLF cho cùng `inputDigest` nhưng khác `rawInputDigest`; file nhị phân khác nhau theo byte; nội dung đổi thì digest đổi; evidence ghi bằng `rawInputDigest`, `inputDigest` và `legacyInputDigest` đều còn khớp; evidence ghi theo `inputDigest` khi file CRLF vẫn khớp sau khi file thành LF; các file nguồn đã sửa không còn byte NUL hay CR đơn.

### Slice 2 (GREEN)
- [x] [chk-focus] Viết `line-endings.ts`; đổi `hashEntries` trả hai bộ entry (đọc mỗi file một lần); thêm `rawInputDigest` vào snapshot và `digestMatches`; chạy lại test digest, snapshot, completion, suite-gate.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] `pnpm run test:gates` (golden snapshot chỉ cập nhật đúng trường mới nếu đầu ra `--snapshot` có trong golden, bằng `HARNIX_UPDATE_GOLDEN=1`); `pnpm version:sync 2.12.0-dev.5 --summary <text> --kind fixed` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Không lưu thêm file; không đổi `workflowOwned` và các quy tắc glob/ignore của digest.
- Mỗi file trong `src/` dưới 300 dòng code; test mới dưới 400 dòng.
- `digest: 3` và `digest: 4` được giữ nguyên làm công thức; không thêm số phiên bản mới.
- Không chạy lại hay sửa evidence đã ghi của task nào.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3, ac-5 | chk-focus | `pnpm exec vitest run test/unit/core/verification test/unit/core/tasks test/unit/core/workflow` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
