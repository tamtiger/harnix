# PRD: Cảnh báo dấu hiệu secret trong file thuộc phạm vi task khi finish

## Vấn đề

Quy tắc 8 nói không in secret, nhưng Harnix không nhắc khi file thuộc công việc đang kết thúc chứa mật khẩu hay connection string (ví dụ một `appsettings.CI.json` chưa commit). Người dùng chỉ phát hiện khi đã commit hoặc đẩy lên.

## Mục tiêu

`harnix workflow --finish --brief` trả thêm `secretAdvisory` khi file thuộc phạm vi task chứa mẫu secret. Chỉ là advisory: không chặn finish, không đổi trạng thái task.

## Hành vi

- Phạm vi: file khớp `relevantPaths` và `inputs` của mọi check của task (glob qua `globby`, `followSymbolicLinks: false`, bỏ `.git`, `node_modules` và các thư mục tạm của digest). Không dùng Git.
- Giới hạn: tối đa 200 file, mỗi file tối đa 128 KiB, bỏ file nhị phân (có byte NUL), không đọc ngoài thư mục project, không đi qua symlink hay junction thoát; thứ tự duyệt ổn định (sắp theo đường dẫn, `relevantPaths` trước).
- Luật (tên ngắn): `private-key`, `vendor-token` (AWS, GitHub, Slack, Google, Anthropic, Stripe), `jwt`, `connection-string-password` (`Password=`/`Pwd=` trong connection string và `scheme://user:pass@`), `credential-assignment` (khóa như `password`, `secret`, `api_key`, `token`, `client_secret` gán một chuỗi trong dấu nháy dài từ 6 ký tự). Bỏ qua giá trị giống placeholder (`<...>`, `${...}`, `{{...}}`, `changeme`, `xxx`, `your-...`, `example`).
- Kết quả: `secretAdvisory: { files, findings: [{ path, rule }] }` với `files` là số file có dấu hiệu và `findings` tối đa 5 mục (đường dẫn tương đối POSIX, tên luật), sắp theo đường dẫn. Không bao giờ có giá trị, dòng hay vị trí của secret. Không có trường khi không phát hiện gì.
- `--finish` không `--brief` giữ nguyên hình dạng (chỉ trả task).
- Lỗi khi quét chỉ làm mất advisory, không bao giờ làm finish thất bại.

## Ngoài phạm vi

- Không quét file ngoài `relevantPaths` và input của check, không quét lịch sử Git, không ghi hay sửa file, không chặn finish, không mạng.
- Không gom mẫu với `learning-safety.ts` và `scripts/scan-secrets.mjs` (xem decision `d-own-patterns`).

## Quyết định

`d-own-patterns` (bộ mẫu riêng trong `secret-scan.ts`), `d-scope-no-git` (phạm vi không dùng Git, nên file chưa commit ngoài phạm vi không được quét), `d-brief-only` (chỉ `--brief` có trường).

## Rủi ro

Dương tính giả trên file test chứa chuỗi giống secret (chỉ advisory, gọn một dòng); âm tính giả với secret dạng lạ. Mẫu bị trùng lặp giữa ba nơi.
