# PRD: Rút gọn output repo-map, giới hạn --refresh và kích hoạt agent dùng repo-map

Task: `20261109-200114-repo-map-compact-refresh-changed` · Epic: `20261109-194501-repo-map-insights` (member 5, đóng epic) · Mode: Full

## 1. Context & Problem Statement

Qua 6 repo thật (`his`, `payment_hub`, `harnix`, ...) agent hầu như không tự gọi `harnix repo-map`: khoảng 50 session chỉ có 0 lần gọi để điều hướng, trong khi có 1.413 `grep` trên một file, 555 `sed -n` và 236 `grep -r` ở repo harnix, và 782 lệnh Grep cùng 2.552 `sed -n` ở `his`. Bốn member trước đã sửa chất lượng (trích xuất, `--tests`, `--query`, `--body`). Member này làm nốt ba việc để công cụ thật sự được dùng:

- **Output còn dài hơn grep:** `--refs buildRepoMapGraph` trả 2.326 byte so với 1.426 byte của `grep -rn` cho cùng việc, và agent gõ `--outline … --format compact` thì bị từ chối vì `--format` chỉ nhận `--query`.
- **`--refresh` in quá nhiều:** ở `his` nó trả 17.929 và 19.274 byte vì mảng `skipped` liệt kê mọi file bị bỏ qua (gồm cả tên `.env.*`); mảng này còn trộn marker `"limit"` với tên file.
- **Không có gì nhắc agent dùng nó:** khối AGENTS luôn nạp không nhắc `repo-map`; mỗi skill chỉ có một mệnh đề "navigation hints only"; hook context chỉ chèn tiêu đề task. Ngân sách hiện còn rất ít: `alwaysLoaded` 1459 trên 1500 và `harnix-plan` 1662 trên 1700.

`--changed` đã bị bỏ khỏi epic: `verify-plan --impact` (không đối số) đã lấy file đổi từ git, gọi `findAffectedTests` và trả test cùng lệnh hẹp, và hưởng luôn thứ hạng mới của `--tests`.

## 2. Scope & Boundaries

Trong phạm vi:
- `--format compact` cho `--outline`, `--refs`, `--impact`, `--tests`; xác thực cờ `--format` theo chế độ.
- `--refresh` (và refresh theo `--workspace`) trả `skippedTotal`, `limitReached` và tối đa 10 đường dẫn không nhạy cảm trong `skipped`.
- Chỉ thị kích hoạt trong skill `harnix-plan`, `harnix-implement`, `harnix-debug`; một mệnh đề trong quy tắc "Token economy" của khối AGENTS luôn nạp; một dòng gợi ý tĩnh trong tiêu đề của hook context ở chế độ lean; nâng ngân sách và ghi `docs/RULE_OWNERSHIP.md`.
- Tài liệu, CHANGELOG và bản phát hành đóng epic `2.31.0` (`pnpm version:sync 2.31.0 --fold-dev`).

Ngoài phạm vi:
- Không `--changed`, không tokenizer hay `--budget`, không hook `PreToolUse`, không thay đổi hook protocol.
- Không đổi `RepoMapV1`, không đổi enum `status`.
- Cursor chỉ nhận chỉ thị qua skill (không có file instruction toàn cục); OpenCode và Cursor không có hook, nên không có gợi ý hook ở đó.

## 3. Anchored Acceptance Criteria

Nguồn chính là `task.json`:
- `ac-1`: `--format compact` cho outline, refs, impact, tests; chuỗi ngắn, một JSON document, nhỏ hơn json; `--format outline` chỉ với query; `--body` không kèm compact; `--format` với refresh hoặc events bị từ chối kèm hint.
- `ac-2`: `--refresh` trả `records`, `scope`, `status`, `skippedTotal`, `limitReached` và tối đa 10 đường dẫn không nhạy cảm; workspace và init cùng định dạng; golden và test hợp đồng cập nhật.
- `ac-4`: chỉ thị ở ba skill và trong khối AGENTS; nâng `alwaysLoaded` và `skills.harnix-plan` có quyết định; `RULE_OWNERSHIP.md` có dòng tương ứng; các test ngân sách, ownership, nguồn skill xanh.
- `ac-5`: hook lean tăng không quá 35 token so với golden hiện tại bằng một dòng tĩnh; không chạy repo-map, không đọc cache; chế độ full và nền tảng hookless không đổi.
- `ac-6`: PRD, README, CHANGELOG, test hợp đồng CLI đồng bộ; phiên bản đóng epic `2.31.0` bằng `--fold-dev`; `test:gates` xanh.

## 4. Architectural & Safety Constraints

- Theo `AGENTS.md`, guide `common.md` và `languages/typescript.md` (strict, không `any`, không `!`).
- `core` không phụ thuộc Commander, Inquirer hay template; file `src` dưới 300 dòng code, complexity tối đa 20; mỗi module `src` có spec 1-1; test dưới 400 dòng; không `../` trong import của test.
- Output công khai: JSON mặc định; chỉ cộng thêm trường (`format`, `skippedTotal`, `limitReached`); `skipped` vẫn là mảng nhưng bị cắt còn 10 và được ghi rõ trong tài liệu; không đổi enum `status`.
- Không lộ tên file nhạy cảm (`secretPath`) trong `skipped`; không đường dẫn tuyệt đối.
- Hook: không gọi repo-map, không đọc cache, không đổi giao thức; chỉ thêm một dòng tĩnh vào tiêu đề lean.
- Ngân sách token: mọi thay đổi trần phải có quyết định ghi lại; đo bằng `pnpm measure:tokens`; golden chỉ cập nhật đúng chuỗi mới (không tái sinh để qua test).
- Không đổi template workflow (`workflow.md`) nên không cần `pnpm selfhost:sync`; nếu `HARNIX_RULES` đổi thì phải kiểm tra mọi bề mặt nền tảng.
- Giữ thay đổi chưa commit của người dùng; không commit, không tạo nhánh.

## Giả định

| Giả định | Trạng thái | Tác động nếu sai |
| --- | --- | --- |
| `alwaysLoaded` đang 1459/1500 và `harnix-plan` 1662/1700 | validated (`pnpm measure:tokens` ngày 2026-11-09) | Mệnh đề mới vượt trần nếu không nâng |
| Hook context chỉ có khi có task active, nên gợi ý hook không chạm session không có task | validated (`effective-context.ts` gọi với task) | Khối AGENTS là cách duy nhất cho session không có task |
| `--format compact` của `--query` đã tồn tại (`compact.ts`) | validated | Có thể dùng chung kiểu |
| Golden hook context có chuỗi tiêu đề lean hiện tại | assumed | Phải cập nhật golden đúng chuỗi mới |

## Điều bạn có thể chưa biết

- Trường `skipped` của `--refresh` giờ chỉ liệt kê tối đa 10 đường dẫn; muốn biết có bao nhiêu file bị bỏ qua hãy đọc `skippedTotal`.
- `--format outline` vẫn chỉ dùng với `--query`; với chế độ khác chỉ chấp nhận `json` hoặc `compact`.
- Cursor và OpenCode không có hook, nên chỉ nhận chỉ thị qua skill (và qua file AGENTS riêng của OpenCode).
- Đây là member đóng epic: bản phát hành `2.31.0` gộp các mục `2.31.0-dev.*` vào một mục CHANGELOG.
