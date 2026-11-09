# PRD: Thêm repo-map --outline --symbol --body để đọc thân symbol

Task: `20261109-200113-repo-map-symbol-body` · Epic: `20261109-194501-repo-map-insights` (member 4) · Mode: Full

## 1. Context & Problem Statement

`harnix repo-map --outline <path> --symbol <name>` chỉ trả chữ ký và khoảng dòng của symbol. Muốn đọc thân thì agent phải `sed -n 'a,bp'`. Đo trên 49 session ở repo PHP `his`: 2.242 lệnh `sed -n`, trung vị 36 dòng, p90 91 dòng; 168 trên 432 file bị đọc lại từ 4 lần trở lên, riêng một file model bị đọc hơn 90 lần. Ở repo Python trung vị 130 dòng. Mỗi lần đọc lại là một lần tốn token và phải đoán số dòng.

Bộ lọc secret hiện có của outline (`secretValue` trong `outline.ts`) chỉ dùng để bỏ dòng khỏi việc dò khai báo, chưa từng che dòng nguồn. Chạy thử ngày 2026-11-09: nó bỏ sót 3 trong 5 dạng secret thường gặp (`'password' => '...'` kiểu CodeIgniter, JSON `"password": "..."`, gán chỉ mục mảng `$db['default']['password'] = '...'`), nên không thể dùng lại để in thân symbol ra.

## 2. Scope & Boundaries

Trong phạm vi:
- Cờ `--body` cho `--outline <path> --symbol <name>`: thêm vào mỗi symbol khớp trường `body` (các dòng nguồn từ `startLine` đến `endLine`), tổng tối đa 200 dòng, kèm `bodyTruncated` khi bị cắt; `--limit` vẫn đếm symbol.
- Che toàn dòng thành `[redacted]` (giữ số dòng) bằng một bộ mẫu secret mạnh hơn; khối private key bị che trọn khối.
- Chỉ đọc thân của file đã được lập chỉ mục: file bị `.gitignore` hoặc `.harnixignore` loại, file nhạy cảm (`.env*`, `appsettings.secrets.json`, `application/config/database.php` và các dạng tương tự) và file chưa có trong cache trả `status: skipped`.
- Module mới `outline-body.ts`, tài liệu, phiên bản `2.31.0-dev.4`.

Ngoài phạm vi:
- Không thêm công cụ sửa symbol (replace, insert); không đọc file ngoài workspace hay theo symlink thoát root; không đổi `RepoMapV1`.
- Không đổi cách dò symbol của `outline.ts`.

## 3. Anchored Acceptance Criteria

Nguồn chính là `task.json`:
- `ac-1`: `--outline <path> --symbol <name> --body` trả `startLine`, `endLine` và các dòng nguồn của từng symbol khớp, tổng tối đa 200 dòng kèm `truncated`; `--limit` đếm symbol.
- `ac-2`: dòng nguồn bị che thành `[redacted]` khi khớp bộ mẫu secret mạnh (khóa `'password' => '...'`, JSON, gán chỉ mục mảng, chuỗi kết nối, Bearer, private key), có test cho từng dạng.
- `ac-3`: `--body` bị từ chối với file bị ignore, file nhạy cảm hoặc chưa được lập chỉ mục; đường dẫn xác thực an toàn như `--outline`; `--body` không kèm `--symbol` bị từ chối bằng lỗi có hint.
- `ac-4`: tài liệu, CHANGELOG, phiên bản `2.31.0-dev.4`, `test:gates` xanh.

## 4. Architectural & Safety Constraints

- Theo `AGENTS.md`, guide `common.md` và `languages/typescript.md` (strict, không `any`, không `!`).
- `outline.ts` đang sát trần 300 dòng code nên phần che secret và cắt thân nằm ở module riêng `outline-body.ts` (spec `outline-body.test.ts`); `core` không phụ thuộc Commander, Inquirer hay template; file test dưới 400 dòng; không `../` trong import của test.
- Output công khai chỉ cộng thêm: trường tùy chọn `body`, `bodyTruncated` và `hint`; không đổi enum `status`, `--limit` hay `RepoMapV1`.
- Không in secret: thà che thừa (kể cả dòng chỉ trông giống secret) còn hơn bỏ sót; không bao giờ in giá trị trong lỗi hay chẩn đoán.
- Đường dẫn: giữ nguyên các kiểm tra của `--outline` (chuẩn hóa, không symlink, trong root, giới hạn kích thước, không nhị phân), cộng thêm điều kiện đã được lập chỉ mục.
- Giữ thay đổi chưa commit của người dùng; không commit, không tạo nhánh.

## Giả định

| Giả định | Trạng thái | Tác động nếu sai |
| --- | --- | --- |
| Cache chỉ chứa file không bị `.gitignore`, `.harnixignore`, `secretPath` hay vượt giới hạn loại | validated (`inventory.ts`) | Có thể in thân file bị ignore |
| Thà che thừa chấp nhận được với agent | assumed | Mất vài dòng hữu ích |
| 200 dòng đủ cho thân một symbol điển hình (p90 của `sed -n` là 91 dòng) | validated bằng số đo | Cần tăng trần |
| `outline.ts` còn dư 2 dòng code cho việc nối `--body` | validated (295 trên 300) | Phải tách thêm |

## Điều bạn có thể chưa biết

- Với file chưa chạy `--refresh` (hoặc file mới), `--body` trả `skipped` kèm `hint`; `--outline` thường vẫn dùng được.
- Bộ che secret có thể che nhầm dòng chỉ chứa tên biến như `password = request.password`; đó là chủ ý.
