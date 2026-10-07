# PRD: version:sync gom các bản dev thành một entry phát hành

## Vấn đề

Member của epic bump `X.Y.0-dev.N` và mỗi lần thêm một entry `## [X.Y.0-dev.N]` vào `CHANGELOG.md`. Khi member cuối đóng epic bằng `X.Y.0`, người làm phải gom tay các entry dev thành một entry phát hành; việc này dễ mất dòng hoặc sai thứ tự.

## Mục tiêu

`pnpm version:sync X.Y.0 --fold-dev` gộp mọi entry `X.Y.0-dev.N` thành đúng một entry `X.Y.0`, giữ nguyên nội dung, và chỉ ghi/định dạng các file mà chính script ghi.

## Phạm vi

- Cờ mới `--fold-dev` (API: `foldDev: true`) chỉ hợp lệ với phiên bản phát hành không có pre-release; báo lỗi rõ khi không có entry dev nào để gom.
- Entry gộp đặt tại vị trí entry dev trên cùng; các mục `### Added/Changed/Fixed` (và mục khác) gộp theo thứ tự xuất hiện đầu tiên, bullet theo thứ tự dev tăng dần rồi đến summary mới (nếu có).
- Chạy lại không đổi gì (idempotent).
- `formatUpdatedFiles` chỉ nhận danh sách file script đã ghi; có test chứng minh file markdown không liên quan giữ nguyên byte.
- Tài liệu chính sách phiên bản (`AGENTS.md`, template `workflow.md` và bản self-host) nêu `--fold-dev`.

## Ngoài phạm vi

- Không đổi chính sách bump, không đổi định dạng các entry không phải dev, không thêm mạng hay dependency.

## Tiêu chí

Xem `task.json`: ac-1 (gộp đúng và idempotent), ac-2 (chỉ định dạng file đã ghi), ac-3 (tài liệu).
