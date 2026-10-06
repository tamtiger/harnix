# PRD: Chuẩn hóa ngôn ngữ ID/title và cột mode của epic

## Vấn đề

1. `harnix workflow --init` sinh slug từ title bằng cách bỏ dấu tiếng Việt, nên ID thành tiếng Việt không dấu (`...-chuan-hoa-ngon-ngu`) trái quy ước ID là tiếng Anh.
2. `harnix epic <epic-id>` và file epic `.md` không cho biết mode (lite/full) của từng member.
3. Quy ước "ID tiếng Anh, title/goal/tiêu chí tiếng Việt có dấu" chưa được ghi ở AGENTS.md, template workflow và skill harnix-plan.
4. Bản ghi epic `20261006-141317-workflow-field-feedback` cần được rà soát và bổ sung phần còn thiếu.

## Phạm vi

- Thêm `--slug <english-kebab-case>` cho `--init`; title có ký tự ngoài ASCII mà thiếu `--slug` báo lỗi rõ; title ASCII vẫn tự sinh slug.
- Thêm `mode` vào member của `harnix epic <epic-id>` và cột `Mode` vào bảng Members của file epic `.md`.
- Ghi quy ước vào AGENTS.md, template `workflow.md` (và `.harnix/workflow.md`), skill `harnix-plan` kể cả reference `epic`, docs.
- Cập nhật bản ghi epic qua `--save` có trường `epic`.

## Không thuộc phạm vi

- Không đổi tên hay sửa task, epic đã tạo.
- Không đoán ngôn ngữ của slug bằng từ điển: chỉ kiểm slug đúng `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

## Tiêu chí chấp nhận

### ac-1: `--init --slug`

`--init` với title có ký tự tiếng Việt có dấu mà thiếu `--slug` báo lỗi nêu phải truyền `--slug <english-kebab-case>`; `--slug` hợp lệ tạo ID đúng regex của task; slug sai định dạng bị từ chối; title ASCII vẫn tự sinh slug như cũ.

**Verifies:** `check-init-slug` cùng `check-suite`.

### ac-2: Cột mode của epic

`harnix epic <epic-id>` trả `mode` của từng member; file epic `.md` có cột Mode; epic hiện có hiển thị bình thường.

**Verifies:** `check-epic-mode` cùng `check-suite`.

### ac-3: Quy ước ngôn ngữ trong tài liệu

AGENTS.md, template workflow, skill harnix-plan (kể cả reference epic) ghi quy ước ID tiếng Anh, title/goal/tiêu chí tiếng Việt có dấu, và nêu `--slug`.

**Verifies:** `check-docs` cùng `check-suite`.

### ac-4: Rà soát epic

Bản ghi epic hiện tại được cập nhật phần còn thiếu qua đường lệnh hợp lệ (`--save` với trường `epic`); không sửa tay file JSON.

**Verifies:** `check-docs` (test đọc bản ghi epic) cùng `check-suite`.

## Rủi ro

- `--init` đổi hành vi với title không ASCII: lệnh cũ không có `--slug` sẽ lỗi (có chủ đích, thông báo nêu cách sửa).
- Mở rộng output `harnix epic <id>` là thêm khóa mới (additive); công cụ đọc theo danh sách khóa cố định cần chịu được khóa mới.
