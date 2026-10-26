# PRD: Gỡ các ma sát gặp khi phát triển harnix bằng chính harnix

## Context & Problem Statement

Trong phiên review và sửa 2.21.1 đến 2.22.1, mỗi vấn đề dưới đây đã làm agent phải đi đường vòng. Phần "Bằng chứng" là điều đã xảy ra, không phải suy đoán.

1. **File runtime bị commit.** `.harnix/tasks/.active` (con trỏ theo từng người) đang được git track và nằm trong nhiều commit; mọi lần chuyển task lại hiện thành thay đổi chưa commit. `.harnix/tmp/` luôn hiện là untracked. Epic reference cũng dặn "không commit `.active` trên nhánh task".
2. **Lint hỏng vì file nháp hợp lệ.** CLAUDE.md và AGENTS.md cho phép đặt script nháp trong `.harnix/tmp/`, nhưng ESLint không bỏ qua `.harnix/**` nên `pnpm lint` fail ngay khi có một file `.cjs` ở đó.
3. **Không thêm được task mà giữ nguyên con trỏ.** `--init` luôn kích hoạt task mới; thêm member vào epic có sẵn buộc phải gửi lại nguyên task đang active kèm `epicMembers`, hoặc `pause` rồi `resume` sau khi tạo.
4. **Sửa không đổi báo lỗi khó hiểu.** `--set-check` với đúng giá trị hiện có trả "contractRevision is allowed only when obligations change at persisted replan".
5. **Output tốn token.** `--transition --dry-run` luôn in `reviewChecklist` 12 dòng; không có cách xem danh sách check gọn nên phải đọc `task.json` bằng script.
6. **Learning bị nhiễu bởi vết quy trình.** Decision ghi số đo hay ghi chú quy trình bị `--finish` chụp thành learning draft (20 draft hiện có).
7. **Chuỗi gate phát hành chạy tay.** Tám lệnh chạy riêng ba lần; `measure:footprint` đỏ từ 2.21.0 mà không ai thấy vì không gate tự động nào chạy nó.
8. **Thông báo khó hiểu khi gửi nhầm kết quả `--inspect`.** `--save` chỉ báo "Invalid or unsupported task record".

## Scope & Boundaries

Trong phạm vi: ac-1 đến ac-10. Ngoài phạm vi: field/enum đóng băng; đổi cơ chế gate footprint (task `20261026-070545-footprint-budget-and-doc-gaps`; riêng việc nâng `maxBytes` có lý do vì hướng dẫn mới của task này thuộc ac-10); promote, reject hay prune learning (chỉ khi người dùng yêu cầu).

Thứ tự: task này làm sau task footprint vì cùng sửa tài liệu và `package.json` và vì ngân sách footprint phải có trước; không có epic hay `followUpOf` (chỉ đặt được lúc `--init`); số phiên bản `2.22.3`, changelog kind `added` hoặc `changed`.

## Anchored Acceptance Criteria

ac-1 đến ac-10 trong `task.json`; mỗi tiêu chí có check tập trung trong Verification Matrix của `plan.md`.

## Architectural & Safety Constraints

`--no-activate` không đổi schema; dry-run tới `ready/ready` của Full vẫn in checklist nên ready-review không bị yếu đi. `trace-` là quy ước id nên TaskRecord giữ nguyên. Gỡ `.active` khỏi index chỉ là `git rm --cached`, không xóa file. Thêm cờ phải đủ năm nơi của mục "Thêm cờ hoặc action workflow" trong AGENTS.md, và golden chỉ đổi đúng chuỗi mới. Tuân thủ AGENTS.md và `.harnix/spec/guides/`.
