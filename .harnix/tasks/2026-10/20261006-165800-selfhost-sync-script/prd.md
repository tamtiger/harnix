# PRD: Script đồng bộ file tự-host

## Vấn đề

Sau mỗi lần sửa template `src/templates/harnix/workflow.md`, `.harnix/workflow.md` và hash trong `.harnix/.template-hashes.json` của chính repo này phải đồng bộ bằng tay; test self-host chỉ báo hai chuỗi hash khác nhau, không nói cách sửa. Câu hỏi mở: vì sao `harnix update` "bỏ qua" `.harnix/workflow.md` và kéo theo guide `common.md`.

## Điều tra (ac-3)

`harnix update --dry-run` liệt kê `.harnix/workflow.md` trong `preserved` vì reconcile gộp trường hợp `unchanged` (đĩa == manifest == template) vào `preserved`; đó không phải bỏ qua. Hash đã chuẩn hóa EOL (`normalizeContentForHash`) nên CRLF của git autocrlf không làm file bị coi là sửa tay. `common.md` nằm trong `updated` vì template guide đã đổi sau lần ghi manifest trước (guide được sửa nhưng hash chưa đồng bộ), nên `update` đúng khi cập nhật nó; đó là thay đổi guide có thật chứ không phải lỗi. Quyết định: không đổi hành vi `harnix update` (non-goal), ghi giải thích vào tài liệu và thêm test hồi quy khóa hành vi `unchanged` → `preserved`.

## Phạm vi

- `scripts/selfhost-sync.mjs` + script `pnpm selfhost:sync`: ghi `.harnix/workflow.md` từ template (LF, kết thúc một dòng trống) và đặt `generatedHash` (đã chuẩn hóa) và `generatorVersion` (từ `package.json`) vào manifest; idempotent.
- Test self-host báo đúng lệnh `pnpm selfhost:sync`.
- AGENTS.md và skill `harnix-implement` chỉ dẫn dùng script ở bước release preparation; tài liệu giải thích điều tra trên.

## Không thuộc phạm vi

Không đổi hành vi `harnix update` cho repo người dùng; không tự commit.

## Tiêu chí chấp nhận

### ac-1: Script đồng bộ

`pnpm selfhost:sync` sinh lại `.harnix/workflow.md` và hash/generatorVersion của manifest; chạy lại không đổi gì; có test.

**Verifies:** `check-selfhost-sync` cùng `check-suite`.

### ac-2: Test self-host nêu lệnh sửa

Test self-host báo lỗi chứa `pnpm selfhost:sync` khi file hoặc hash lệch.

**Verifies:** `check-selfhost-sync` (test self-host) cùng `check-suite`.

### ac-3: Điều tra `harnix update`

Nguyên nhân được ghi vào tài liệu; test hồi quy khóa việc file đã đồng bộ được báo `preserved` và không ghi lại.

**Verifies:** `check-selfhost-sync` và `check-docs` cùng `check-suite`.

### ac-4: Chỉ dẫn release

AGENTS.md và skill `harnix-implement` chỉ dẫn dùng `pnpm selfhost:sync` ở release preparation.

**Verifies:** `check-docs` cùng `check-suite`.

## Rủi ro

Script ghi file nên chỉ chạy trong repo này; nó từ chối chạy khi không thấy `src/templates/harnix/workflow.md`.
